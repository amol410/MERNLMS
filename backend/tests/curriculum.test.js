const request = require('supertest');
const app = require('../server');
const CurriculumLesson = require('../models/CurriculumLesson');
const { createTestUser, createTestAdmin } = require('./setup');

describe('Curriculum, Lesson Management, and Publishing API', () => {
    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
    });

    describe('POST /api/curriculum/lessons', () => {
        it('admin can create a lesson (defaults to isLive: false / draft)', async () => {
            const { token: adminToken } = await createTestAdmin();

            const payload = {
                title: 'Begrüßung',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.lesson).toBeDefined();
            expect(res.body.lesson.title).toBe('Begrüßung');
            expect(res.body.lesson.learningLanguage).toBe('de');
            expect(res.body.lesson.nativeLanguage).toBe('en');
            expect(res.body.lesson.level).toBe('A1');
            expect(res.body.lesson.unitNumber).toBe(1);
            expect(res.body.lesson.isLive).toBe(false);

            // Verify persisted record in database
            const savedLesson = await CurriculumLesson.findByPk(res.body.lesson.id);
            expect(savedLesson).not.toBeNull();
            expect(savedLesson.isLive).toBe(false);
        });

        it('student is blocked with HTTP 403', async () => {
            const { token: studentToken } = await createTestUser();

            const payload = {
                title: 'Begrüßung',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(payload);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized/i);
        });
    });

    describe('PATCH /api/curriculum/lessons/:id/live', () => {
        it('admin can toggle draft to live', async () => {
            const { user: adminUser, token: adminToken } = await createTestAdmin();

            const draftLesson = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Draft Lesson',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                isLive: false,
            });

            expect(draftLesson.isLive).toBe(false);

            const res = await request(app)
                .patch(`/api/curriculum/lessons/${draftLesson.id}/live`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isLive: true });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.lesson).toBeDefined();
            expect(res.body.lesson.isLive).toBe(true);

            // Verify database update
            const updated = await CurriculumLesson.findByPk(draftLesson.id);
            expect(updated.isLive).toBe(true);
        });
    });

    describe('GET /api/gamification/path', () => {
        it('only returns live lessons, hides drafts from students', async () => {
            const { user: adminUser } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            // Create 1 draft lesson (isLive: false) and 1 live lesson (isLive: true)
            const draftLesson = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Draft Lesson Hidden',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                isLive: false,
            });

            const liveLesson = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Live Lesson Visible',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 1,
                isLive: true,
            });

            const res = await request(app)
                .get('/api/gamification/path')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.nodes)).toBe(true);

            // In returned nodes, the live lesson should be present, and the draft lesson should NOT be present
            const liveNode = res.body.nodes.find(node => node.id === liveLesson.id || node.title === 'Live Lesson Visible');
            const draftNode = res.body.nodes.find(node => node.id === draftLesson.id || node.title === 'Draft Lesson Hidden');

            expect(liveNode).toBeDefined();
            expect(liveNode.id).toBe(liveLesson.id);
            expect(draftNode).toBeUndefined();
        });
    });

    describe('CurriculumLesson stages JSON serialization', () => {
        it('saves word_match and cloze_test correctly', async () => {
            const { token: adminToken } = await createTestAdmin();

            const stages = [
                {
                    type: 'word_match',
                    pairs: [{ target: 'Hallo', native: 'Hello' }],
                },
                {
                    type: 'cloze_test',
                    sentence: 'Ich _____ Anna.',
                    blank: 'bin',
                    options: ['bin', 'bist'],
                },
            ];

            const createRes = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Stages Serialization Lesson',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    stages,
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.success).toBe(true);
            const lessonId = createRes.body.lesson.id;

            // Fetch lesson via GET /api/gamification/lesson/:id
            const fetchRes = await request(app)
                .get(`/api/gamification/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(fetchRes.status).toBe(200);
            expect(fetchRes.body.success).toBe(true);
            expect(fetchRes.body.lesson).toBeDefined();

            const returnedStages = fetchRes.body.lesson.stages;
            expect(Array.isArray(returnedStages)).toBe(true);
            expect(returnedStages).toHaveLength(2);

            expect(returnedStages[0].type).toBe('word_match');
            expect(returnedStages[0].pairs).toEqual([{ target: 'Hallo', native: 'Hello' }]);

            expect(returnedStages[1].type).toBe('cloze_test');
            expect(returnedStages[1].sentence).toBe('Ich _____ Anna.');
            expect(returnedStages[1].blank).toBe('bin');
            expect(returnedStages[1].options).toEqual(['bin', 'bist']);
        });
    });
});
