const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const UserNodeProgress = require('../models/UserNodeProgress');
const CurriculumLesson = require('../models/CurriculumLesson');
const { createTestUser } = require('./setup');

describe('Duolingo-Style Placement, A1 Section 2 Fallback & Universal Challenges', () => {
    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
        await UserNodeProgress.destroy({ where: {} });
    });

    describe('1. Diagnostic Placement Questions Blueprint', () => {
        it('returns 12 calibrated A1/A2/B1 questions for German (de/en) and English (en/mr)', async () => {
            const { token } = await createTestUser({ targetLanguage: 'de', nativeLanguage: 'en' });

            const deRes = await request(app)
                .get('/api/gamification/placement/questions?targetLanguage=de&nativeLanguage=en')
                .set('Authorization', `Bearer ${token}`);

            expect(deRes.status).toBe(200);
            expect(deRes.body.success).toBe(true);
            expect(deRes.body.questions).toHaveLength(12);
            expect(deRes.body.questions.filter(q => q.cefr === 'A1')).toHaveLength(4);
            expect(deRes.body.questions.filter(q => q.cefr === 'A2')).toHaveLength(4);
            expect(deRes.body.questions.filter(q => q.cefr === 'B1')).toHaveLength(4);

            const enRes = await request(app)
                .get('/api/gamification/placement/questions?targetLanguage=en&nativeLanguage=mr')
                .set('Authorization', `Bearer ${token}`);

            expect(enRes.status).toBe(200);
            expect(enRes.body.questions).toHaveLength(12);
            expect(enRes.body.targetLanguage).toBe('en');
            expect(enRes.body.nativeLanguage).toBe('mr');
        });
    });

    describe('2. Missing Content Safe Routing (A2/B1 -> A1 Section 2 Explorer Fallback)', () => {
        it('routes user who tests into A2 or B1 to A1 Section 2 (Unit 36) via virtual skip pointer when A2/B1 has 0 lessons, with 0 ghost rows and 0 XP/Pearls exploit', async () => {
            // Seed A1 Units 1, 2, and 36 (Section 2: Explorer)
            await CurriculumLesson.bulkCreate([
                {
                    owner: 1,
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    unitTitle: 'Unit 1: Basics',
                    lessonIndex: 1,
                    title: 'Greetings 1',
                    nodeType: 'lesson',
                    isLive: true,
                    stages: [{ type: 'word_match', pairs: [{ target: 'Hallo', native: 'Hello' }] }],
                },
                {
                    owner: 1,
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 2,
                    unitTitle: 'Unit 2: Cafe',
                    lessonIndex: 1,
                    title: 'Cafe 1',
                    nodeType: 'lesson',
                    isLive: true,
                    stages: [{ type: 'word_match', pairs: [{ target: 'Kaffee', native: 'Coffee' }] }],
                },
                {
                    owner: 1,
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 36,
                    unitTitle: 'Unit 36: Explorer Start',
                    lessonIndex: 1,
                    title: 'Section 2 Lesson 1',
                    nodeType: 'lesson',
                    isLive: true,
                    stages: [{ type: 'word_match', pairs: [{ target: 'Bahnhof', native: 'Station' }] }],
                },
            ]);

            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user, token } = await createTestUser({
                targetLanguage: 'de',
                nativeLanguage: 'en',
                totalXp: 50,
                pearls: 100,
                streakCount: 3,
                lastActiveDate: yesterday,
            });

            // User scores 75% (9/12) -> Tests into A2, but A2 has 0 live lessons
            const evalRes = await request(app)
                .post('/api/gamification/placement/evaluate')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    scorePct: 75,
                    correctCount: 9,
                    totalQuestions: 12,
                    targetLanguage: 'de',
                    nativeLanguage: 'en',
                });

            expect(evalRes.status).toBe(200);
            expect(evalRes.body.success).toBe(true);
            expect(evalRes.body.placement.assignedLevel).toBe('A2');
            expect(evalRes.body.placement.effectiveLevel).toBe('A1');
            expect(evalRes.body.placement.isFallback).toBe(true);
            expect(evalRes.body.placement.targetSectionNumber).toBe(2);
            expect(evalRes.body.placement.targetUnitNumber).toBe(36);
            expect(evalRes.body.placement.placementSkipToNode).toBe(2); // Index 2 is Unit 36 Lesson 1
            expect(evalRes.body.placement.xpEarned).toBe(0);
            expect(evalRes.body.placement.pearlsEarned).toBe(0);

            // Verify zero ghost rows were inserted into UserNodeProgress
            const progressCount = await UserNodeProgress.count({ where: { userId: user.id } });
            expect(progressCount).toBe(0);

            // Verify streak incremented from 3 -> 4 and XP/Pearls were not inflated
            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.streakCount).toBe(4);
            expect(refreshedUser.totalXp).toBe(50);
            expect(refreshedUser.pearls).toBe(100);

            // Verify GET /api/gamification/path marks indices 0 & 1 as completed (fast-tracked) and index 2 (Unit 36) as available
            const pathRes = await request(app)
                .get('/api/gamification/path?targetLanguage=de&nativeLanguage=en&level=A1')
                .set('Authorization', `Bearer ${token}`);

            expect(pathRes.status).toBe(200);
            expect(pathRes.body.nodes).toHaveLength(3);
            expect(pathRes.body.nodes[0].status).toBe('completed');
            expect(pathRes.body.nodes[0].isFastTracked).toBe(true);
            expect(pathRes.body.nodes[1].status).toBe('completed');
            expect(pathRes.body.nodes[1].isFastTracked).toBe(true);
            expect(pathRes.body.nodes[2].unitNumber).toBe(36);
            expect(pathRes.body.nodes[2].status).toBe('available');
        });

        it('routes directly to A2 Unit 1 when A2 curriculum lessons ARE published', async () => {
            await CurriculumLesson.create({
                owner: 1,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A2',
                unitNumber: 1,
                unitTitle: 'A2 Unit 1',
                lessonIndex: 1,
                title: 'A2 Intro',
                nodeType: 'lesson',
                isLive: true,
                stages: [{ type: 'word_match', pairs: [{ target: 'Reise', native: 'Journey' }] }],
            });

            const { token } = await createTestUser({ targetLanguage: 'de', nativeLanguage: 'en' });

            const evalRes = await request(app)
                .post('/api/gamification/placement/evaluate')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    scorePct: 65,
                    correctCount: 8,
                    totalQuestions: 12,
                    targetLanguage: 'de',
                    nativeLanguage: 'en',
                });

            expect(evalRes.status).toBe(200);
            expect(evalRes.body.placement.assignedLevel).toBe('A2');
            expect(evalRes.body.placement.effectiveLevel).toBe('A2');
            expect(evalRes.body.placement.isFallback).toBe(false);
            expect(evalRes.body.status.currentLevel).toBe('A2');
        });
    });

    describe('3. High-Water Mark Rule & Mid-Course Jump Gate', () => {
        it('never demotes an existing learner who already has higher progress', async () => {
            const { user, token } = await createTestUser({
                targetLanguage: 'de',
                nativeLanguage: 'en',
                placementSkipToNode: 15,
                placementSkipMap: JSON.stringify({ de_en_a1: 15 }),
            });

            // Retake placement test and score 10% (A1)
            const evalRes = await request(app)
                .post('/api/gamification/placement/evaluate')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    scorePct: 10,
                    correctCount: 1,
                    totalQuestions: 12,
                    targetLanguage: 'de',
                    nativeLanguage: 'en',
                });

            expect(evalRes.status).toBe(200);
            expect(evalRes.body.placement.placementSkipToNode).toBe(15);
            const updated = await User.findByPk(user.id);
            expect(updated.placementSkipToNode).toBe(15);
        });

        it('validates mid-course jump-section 3-mistake rule and unlocks target unit on pass', async () => {
            await CurriculumLesson.bulkCreate([
                { owner: 1, learningLanguage: 'de', nativeLanguage: 'en', level: 'A1', unitNumber: 1, lessonIndex: 1, title: 'U1', isLive: true, stages: [] },
                { owner: 1, learningLanguage: 'de', nativeLanguage: 'en', level: 'A1', unitNumber: 2, lessonIndex: 1, title: 'U2', isLive: true, stages: [] },
                { owner: 1, learningLanguage: 'de', nativeLanguage: 'en', level: 'A1', unitNumber: 5, lessonIndex: 1, title: 'U5', isLive: true, stages: [] },
            ]);

            const { token } = await createTestUser({ targetLanguage: 'de', nativeLanguage: 'en' });

            // Fail jump (> 3 mistakes)
            const failRes = await request(app)
                .post('/api/gamification/jump-section')
                .set('Authorization', `Bearer ${token}`)
                .send({ targetUnitNumber: 5, scorePct: 60, mistakesCount: 4 });

            expect(failRes.status).toBe(200);
            expect(failRes.body.passed).toBe(false);

            // Pass jump (90%, 1 mistake)
            const passRes = await request(app)
                .post('/api/gamification/jump-section')
                .set('Authorization', `Bearer ${token}`)
                .send({ targetUnitNumber: 5, scorePct: 90, mistakesCount: 1 });

            expect(passRes.status).toBe(200);
            expect(passRes.body.passed).toBe(true);
            expect(passRes.body.unlockedNodeIndex).toBe(2); // Index 2 is Unit 5
        });
    });

    describe('4. Universal Lesson-Agnostic Challenge Types', () => {
        it('allows all 10 challenge types (including picture_select and karaoke) inside any lesson in any unit', async () => {
            const all10Stages = [
                { type: 'word_match', enabled: true, pairs: [{ target: 'Hund', native: 'Dog' }] },
                { type: 'listen_tap', enabled: true, targetSentence: 'Der Hund schläft', tokens: ['Der', 'Hund', 'schläft'] },
                {
                    type: 'picture_select',
                    enabled: true,
                    prompt: 'Select the dog',
                    targetWord: 'der Hund',
                    translation: 'the dog',
                    options: [
                        { id: '1', text: 'der Hund', imageUrl: '/uploads/dog.webp', isCorrect: true },
                        { id: '2', text: 'die Katze', imageUrl: '/uploads/cat.webp', isCorrect: false },
                    ],
                },
                { type: 'cloze_test', enabled: true, sentence: 'Ich _____ Deutsch.', blank: 'lerne', options: ['lerne', 'lernst'] },
                { type: 'sentence_builder', enabled: true, prompt: 'Translate', targetSentence: 'Guten Tag', tokens: ['Guten', 'Tag'] },
                { type: 'type_word', enabled: true, prompt: 'Der Kaffee ist _____.', target: 'heiß' },
                { type: 'dialogue_bubble', enabled: true, partnerName: 'Mia', partnerMessage: 'Hallo!', options: [{ text: 'Hallo!', isCorrect: true }] },
                { type: 'listen_select', enabled: true, sentence: 'Ein Wasser bitte', question: 'What is ordered?', options: [{ text: 'Water', isCorrect: true }] },
                { type: 'sprechen', enabled: true, prompt: 'Guten Morgen', translation: 'Good morning' },
                { type: 'karaoke', enabled: true, storyText: 'Hallo aus Berlin!', translationText: 'Hello from Berlin!' },
            ];

            const lesson = await CurriculumLesson.create({
                owner: 1,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 12,
                unitTitle: 'Universal Challenge Unit',
                lessonIndex: 3,
                title: 'All 10 Challenges in One Lesson',
                nodeType: 'lesson',
                isLive: true,
                stages: all10Stages,
            });

            const { token } = await createTestUser();
            const res = await request(app)
                .get(`/api/gamification/lesson/${lesson.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.lesson.stages).toHaveLength(10);
            const returnedTypes = res.body.lesson.stages.map(s => s.type);
            expect(returnedTypes).toEqual([
                'word_match',
                'listen_tap',
                'picture_select',
                'cloze_test',
                'sentence_builder',
                'type_word',
                'dialogue_bubble',
                'listen_select',
                'sprechen',
                'karaoke',
            ]);
        });
    });
});
