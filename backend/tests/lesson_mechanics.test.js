const request = require('supertest');
const app = require('../server');
const CurriculumLesson = require('../models/CurriculumLesson');
const { createTestUser, createTestAdmin } = require('./setup');

describe('Lesson Interactive Mechanics & Audio Dictation Stages Backend API', () => {
    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
    });

    describe('Interactive Matching Pairs Stage (match_pairs / word_match)', () => {
        it('persists match_pairs stage with target and native language pairs', async () => {
            const { token: adminToken } = await createTestAdmin();

            const matchPairsStage = {
                type: 'match_pairs',
                pairs: [
                    { target: 'Wasser', native: 'Water' },
                    { target: 'Brot', native: 'Bread' },
                    { target: 'Kaffee', native: 'Coffee' },
                    { target: 'Tee', native: 'Tea' },
                    { target: 'Milch', native: 'Milk' }
                ]
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Essential Drinks & Food',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    nodeType: 'match',
                    stages: [matchPairsStage],
                    isLive: true
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            const lessonId = res.body.lesson.id;

            // Fetch as a student
            const { token: studentToken } = await createTestUser();
            const fetchRes = await request(app)
                .get(`/api/gamification/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(fetchRes.status).toBe(200);
            expect(fetchRes.body.success).toBe(true);
            const stages = fetchRes.body.lesson.stages;
            expect(Array.isArray(stages)).toBe(true);
            expect(stages.length).toBe(1);
            expect(stages[0].type).toBe('match_pairs');
            expect(stages[0].pairs).toHaveLength(5);
            expect(stages[0].pairs[0]).toEqual({ target: 'Wasser', native: 'Water' });
            expect(stages[0].pairs[4]).toEqual({ target: 'Milch', native: 'Milk' });
        });

        it('supports alternative key formats (german/english) accepted by Flutter client parser', async () => {
            const { token: adminToken } = await createTestAdmin();

            const altPairsStage = {
                type: 'word_match',
                pairs: [
                    { german: 'Guten Tag', english: 'Good day' },
                    { german: 'Auf Wiedersehen', english: 'Goodbye' }
                ]
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Greetings Pairs',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    stages: [altPairsStage]
                });

            expect(res.status).toBe(201);
            const lessonId = res.body.lesson.id;

            const fetchRes = await request(app)
                .get(`/api/gamification/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(fetchRes.body.lesson.stages[0].pairs[0].german).toBe('Guten Tag');
            expect(fetchRes.body.lesson.stages[0].pairs[0].english).toBe('Good day');
        });
    });

    describe('Audio Dictation & Turtle Speed Stage (listen_tap)', () => {
        it('persists targetSentence, tokens bank, and translation for listen_tap challenges', async () => {
            const { token: adminToken } = await createTestAdmin();

            const listenTapStage = {
                type: 'listen_tap',
                targetSentence: 'Das Wasser ist kalt',
                translation: 'The water is cold',
                tokens: ['Das', 'Wasser', 'ist', 'kalt', 'warm', 'heiß']
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Cold Water Dictation',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    stages: [listenTapStage],
                    isLive: true
                });

            expect(res.status).toBe(201);
            const lessonId = res.body.lesson.id;

            const { token: studentToken } = await createTestUser();
            const fetchRes = await request(app)
                .get(`/api/gamification/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(fetchRes.status).toBe(200);
            const stage = fetchRes.body.lesson.stages[0];
            expect(stage.type).toBe('listen_tap');
            expect(stage.targetSentence).toBe('Das Wasser ist kalt');
            expect(stage.translation).toBe('The water is cold');
            expect(stage.tokens).toEqual(['Das', 'Wasser', 'ist', 'kalt', 'warm', 'heiß']);
        });
    });

    describe('Composite Multi-Stage Lesson Editing and Security', () => {
        it('admin can update a lesson to append matching pairs and listen_tap stages', async () => {
            const { token: adminToken } = await createTestAdmin();

            // Initial simple lesson
            const createRes = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Composite Stage Lesson',
                    stages: []
                });

            const lessonId = createRes.body.lesson.id;

            // Update with 2 stages: match_pairs followed by listen_tap
            const updateRes = await request(app)
                .put(`/api/curriculum/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    stages: [
                        {
                            type: 'match_pairs',
                            pairs: [{ target: 'Ja', native: 'Yes' }, { target: 'Nein', native: 'No' }]
                        },
                        {
                            type: 'listen_tap',
                            targetSentence: 'Ja bitte',
                            translation: 'Yes please',
                            tokens: ['Ja', 'bitte', 'danke']
                        }
                    ]
                });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.lesson.stages).toHaveLength(2);
            expect(updateRes.body.lesson.stages[0].type).toBe('match_pairs');
            expect(updateRes.body.lesson.stages[1].type).toBe('listen_tap');
        });

        it('students are forbidden from creating or updating lesson stages', async () => {
            const { token: studentToken } = await createTestUser();

            const createRes = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Hacked Lesson',
                    stages: [{ type: 'match_pairs' }]
                });

            expect(createRes.status).toBe(403);

            const updateRes = await request(app)
                .put('/api/curriculum/lessons/1')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ stages: [] });

            expect(updateRes.status).toBe(403);
        });
    });

    describe('Picture Vocabulary Cards & WebP Sharp Pipeline', () => {
        it('compresses uploaded image to WebP (400x400 max, 80% quality)', async () => {
            const { token: adminToken } = await createTestAdmin();
            const sharp = require('sharp');

            // Generate an in-memory 200x200 PNG test image
            const testPngBuffer = await sharp({
                create: {
                    width: 200,
                    height: 200,
                    channels: 4,
                    background: { r: 52, g: 152, b: 219, alpha: 1 }
                }
            }).png().toBuffer();

            const res = await request(app)
                .post('/api/curriculum/upload-image')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('image', testPngBuffer, 'test_card.png');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('webp');
            expect(res.body.url).toMatch(/^\/uploads\/curriculum\/curr-.*\.webp$/);
            expect(res.body.width).toBeLessThanOrEqual(400);
            expect(res.body.height).toBeLessThanOrEqual(400);
        });

        it('rejects image upload without file with HTTP 400', async () => {
            const { token: adminToken } = await createTestAdmin();

            const res = await request(app)
                .post('/api/curriculum/upload-image')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('students are blocked from uploading curriculum images with HTTP 403', async () => {
            const { token: studentToken } = await createTestUser();

            const res = await request(app)
                .post('/api/curriculum/upload-image')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
        });

        it('persists picture_select visual vocabulary stage in curriculum lesson', async () => {
            const { token: adminToken } = await createTestAdmin();

            const pictureStage = {
                type: 'picture_select',
                prompt: 'Choose the correct picture for "der Apfel"',
                targetWord: 'der Apfel',
                translation: 'The apple',
                options: [
                    { id: 'opt_1', text: 'der Apfel', imageUrl: '/uploads/curriculum/apple.webp', isCorrect: true },
                    { id: 'opt_2', text: 'die Banane', imageUrl: '/uploads/curriculum/banana.webp', isCorrect: false },
                    { id: 'opt_3', text: 'das Brot', imageUrl: '/uploads/curriculum/bread.webp', isCorrect: false },
                    { id: 'opt_4', text: 'der Kaffee', imageUrl: '/uploads/curriculum/coffee.webp', isCorrect: false }
                ]
            };

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Fruit Vocabulary Visual Cards',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    stages: [pictureStage],
                    isLive: true
                });

            expect(res.status).toBe(201);
            const lessonId = res.body.lesson.id;

            const { token: studentToken } = await createTestUser();
            const fetchRes = await request(app)
                .get(`/api/gamification/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(fetchRes.status).toBe(200);
            const stage = fetchRes.body.lesson.stages[0];
            expect(stage.type).toBe('picture_select');
            expect(stage.targetWord).toBe('der Apfel');
            expect(stage.options).toHaveLength(4);
            expect(stage.options[0].isCorrect).toBe(true);
            expect(stage.options[0].imageUrl).toBe('/uploads/curriculum/apple.webp');
        });
    });
});
