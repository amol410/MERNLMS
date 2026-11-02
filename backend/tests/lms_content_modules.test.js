const request = require('supertest');
const app = require('../server');
const { createTestUser, createTestAdmin } = require('./setup');

describe('LMS Content Modules Suite (Notes, Quizzes, Flashcards, Videos, Subjects, Activity, Pages, Crawlers)', () => {
    describe('1. Subjects & Topics (/api/subjects)', () => {
        it('allows admin/trainer to create subject, add topic, list subjects, and delete subject', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            // Student cannot create subject
            const forbiddenRes = await request(app)
                .post('/api/subjects')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ name: 'Unauthorized Subject' });
            expect(forbiddenRes.status).toBe(403);

            // Admin creates subject
            const createRes = await request(app)
                .post('/api/subjects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'German A1 Grammar',
                    description: 'Core German grammar structures',
                    icon: '🇩🇪',
                    color: '#06B6D4',
                });
            expect(createRes.status).toBe(201);
            const subjectId = createRes.body.subject.id || createRes.body.subject._id;
            expect(subjectId).toBeDefined();

            // Add topic
            const topicRes = await request(app)
                .post(`/api/subjects/${subjectId}/topics`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Modal Verbs', description: 'können, müssen, wollen' });
            expect(topicRes.status).toBe(201);

            // Public GET /api/subjects
            const listRes = await request(app).get('/api/subjects');
            expect(listRes.status).toBe(200);
            expect(Array.isArray(listRes.body.subjects)).toBe(true);
            expect(listRes.body.subjects.some((s) => s.name === 'German A1 Grammar')).toBe(true);

            // Admin deletes subject
            const delRes = await request(app)
                .delete(`/api/subjects/${subjectId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(delRes.status).toBe(200);
        });
    });

    describe('2. Notes & Karaoke Engagement (/api/notes)', () => {
        it('creates note, fetches by id, toggles pin, tracks view engagement, and deletes note', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            // Create note
            const createRes = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Der Die Das Rules',
                    content: '<p>Definite articles in German</p>',
                    contentType: 'richtext',
                    tags: ['articles', 'A1'],
                    isPublic: true,
                });
            expect(createRes.status).toBe(201);
            const noteId = createRes.body.note.id || createRes.body.note._id;

            // Student fetches notes list
            const listRes = await request(app)
                .get('/api/notes')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(listRes.status).toBe(200);
            expect(listRes.body.notes.length).toBeGreaterThanOrEqual(1);

            // Student fetches single note
            const detailRes = await request(app)
                .get(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(detailRes.status).toBe(200);
            expect(detailRes.body.note.title).toBe('Der Die Das Rules');

            // Admin toggles pin
            const pinRes = await request(app)
                .patch(`/api/notes/${noteId}/pin`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(pinRes.status).toBe(200);
            expect(pinRes.body.note.isPinned).toBe(true);

            // Student tracks view engagement
            const trackRes = await request(app)
                .post(`/api/notes/${noteId}/track`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ engagementSecs: 45 });
            expect(trackRes.status).toBe(200);

            // Admin deletes note
            const delRes = await request(app)
                .delete(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(delRes.status).toBe(200);
        });
    });

    describe('3. Quizzes & Attempt Grading (/api/quizzes)', () => {
        it('creates quiz with MCQ and match-pairs, grades student attempt, and returns review', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            const createRes = await request(app)
                .post('/api/quizzes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'A1 Checkpoint Quiz',
                    description: 'Checkpoint assessment',
                    passingScore: 50,
                    timeLimit: 10,
                    isPublished: true,
                    questions: [
                        {
                            text: 'What is "Good morning" in German?',
                            type: 'multiple-choice',
                            options: ['Guten Morgen', 'Gute Nacht', 'Tschüss', 'Danke'],
                            correctIndex: 0,
                            points: 5,
                        },
                        {
                            text: 'Match the numbers',
                            type: 'match-pairs',
                            pairs: [
                                { left: 'Eins', right: 'One' },
                                { left: 'Zwei', right: 'Two' },
                            ],
                            points: 5,
                        },
                    ],
                });
            expect(createRes.status).toBe(201);
            const quizId = createRes.body.quiz.id || createRes.body.quiz._id;
            const createdQuestions = createRes.body.quiz.questions;

            // Submit attempt
            const attemptRes = await request(app)
                .post(`/api/quizzes/${quizId}/attempt`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    timeTakenSecs: 42,
                    answers: [
                        {
                            questionId: createdQuestions[0]._id ?? 0,
                            chosenIndex: 0,
                        },
                        {
                            questionId: createdQuestions[1]._id ?? 1,
                            matches: [
                                { left: 'Eins', right: 'One' },
                                { left: 'Zwei', right: 'Two' },
                            ],
                        },
                    ],
                });
            expect(attemptRes.status).toBe(201);
            expect(attemptRes.body.result.attempt.passed).toBe(true);
            expect(attemptRes.body.result.attempt.percentage).toBe(100);

            // Fetch review
            const reviewRes = await request(app)
                .get(`/api/quizzes/${quizId}/review`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(reviewRes.status).toBe(200);

            // Fetch my attempts
            const myAttRes = await request(app)
                .get(`/api/quizzes/${quizId}/attempts`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(myAttRes.status).toBe(200);
            expect(myAttRes.body.attempts.length).toBe(1);
        });

        it('returns unpublished draft quizzes to trainers/admins while only returning published quizzes to students and unauthenticated users', async () => {
            const { token: trainerToken } = await createTestUser({
                name: 'Frau Muller',
                role: 'trainer',
            });
            const { token: studentToken } = await createTestUser();

            // Trainer creates an unpublished draft quiz
            const draftRes = await request(app)
                .post('/api/quizzes')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send({
                    title: 'Unpublished Trainer Draft Quiz',
                    description: 'Work in progress quiz',
                    passingScore: 60,
                    timeLimit: 10,
                    isPublished: false,
                    questions: [
                        {
                            text: 'Draft Question 1',
                            type: 'multiple-choice',
                            options: ['Ja', 'Nein'],
                            correctIndex: 0,
                            points: 5,
                        },
                    ],
                });
            expect(draftRes.status).toBe(201);
            expect(draftRes.body.quiz.isPublished).toBe(false);

            // Trainer creates a published quiz
            const pubRes = await request(app)
                .post('/api/quizzes')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send({
                    title: 'Published Public Quiz',
                    description: 'Ready for students',
                    passingScore: 60,
                    timeLimit: 10,
                    isPublished: true,
                    questions: [
                        {
                            text: 'Published Question 1',
                            type: 'multiple-choice',
                            options: ['Gern', 'Nicht'],
                            correctIndex: 0,
                            points: 5,
                        },
                    ],
                });
            expect(pubRes.status).toBe(201);

            // Trainer GET /api/quizzes sees both draft and published quizzes
            const trainerListRes = await request(app)
                .get('/api/quizzes')
                .set('Authorization', `Bearer ${trainerToken}`);
            expect(trainerListRes.status).toBe(200);
            expect(
                trainerListRes.body.quizzes.some((q) => q.title === 'Unpublished Trainer Draft Quiz')
            ).toBe(true);
            expect(
                trainerListRes.body.quizzes.some((q) => q.title === 'Published Public Quiz')
            ).toBe(true);

            // Student GET /api/quizzes only sees published quizzes
            const studentListRes = await request(app)
                .get('/api/quizzes')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(studentListRes.status).toBe(200);
            expect(
                studentListRes.body.quizzes.some((q) => q.title === 'Unpublished Trainer Draft Quiz')
            ).toBe(false);
            expect(
                studentListRes.body.quizzes.some((q) => q.title === 'Published Public Quiz')
            ).toBe(true);

            // Unauthenticated GET /api/quizzes only sees published quizzes
            const anonListRes = await request(app).get('/api/quizzes');
            expect(anonListRes.status).toBe(200);
            expect(
                anonListRes.body.quizzes.some((q) => q.title === 'Unpublished Trainer Draft Quiz')
            ).toBe(false);
            expect(
                anonListRes.body.quizzes.some((q) => q.title === 'Published Public Quiz')
            ).toBe(true);
        });
    });

    describe('4. Flashcards & Study Progress (/api/flashcards)', () => {
        it('creates deck, adds card, records study progress in both Array and Flutter Map formats, and retrieves progress', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            const createRes = await request(app)
                .post('/api/flashcards')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    deckName: 'Essential Verbs',
                    description: 'Common verbs',
                    isPublic: true,
                    cards: [
                        { front: 'sein', back: 'to be' },
                        { front: 'haben', back: 'to have' },
                    ],
                });
            expect(createRes.status).toBe(201);
            const deckId = createRes.body.deck.id || createRes.body.deck._id;

            // Add card
            const addCardRes = await request(app)
                .post(`/api/flashcards/${deckId}/cards`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ front: 'werden', back: 'to become' });
            expect(addCardRes.status).toBe(200);

            // Student saves array-format progress ([{ cardId, status }])
            const progRes = await request(app)
                .post(`/api/flashcards/${deckId}/progress`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    cardResults: [
                        { cardId: '0', status: 'known' },
                        { cardId: '1', status: 'learning' },
                    ],
                    engagementSecs: 30,
                });
            expect(progRes.status).toBe(200);
            expect(progRes.body.progress.cardResults).toHaveLength(2);

            // Student saves Flutter Map-format progress ({ "0": "known", "1": "learning" })
            const mapProgRes = await request(app)
                .post(`/api/flashcards/${deckId}/progress`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    cardResults: {
                        '0': 'known',
                        '1': 'learning',
                        '2': 'known',
                    },
                    engagementSecs: 25,
                });
            expect(mapProgRes.status).toBe(200);
            expect(mapProgRes.body.progress.cardResults).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ cardId: '0', status: 'known' }),
                    expect.objectContaining({ cardId: '1', status: 'learning' }),
                    expect.objectContaining({ cardId: '2', status: 'known' }),
                ])
            );
            expect(mapProgRes.body.progress.masteredCount).toBe(2);

            // Get progress
            const getProgRes = await request(app)
                .get(`/api/flashcards/${deckId}/progress`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(getProgRes.status).toBe(200);
            expect(getProgRes.body.progress.cardResults).toHaveLength(3);
        });
    });

    describe('5. Videos & Activity Summary (/api/videos, /api/activity)', () => {
        it('adds YouTube video, fetches video details, and retrieves user activity summary', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();

            const createRes = await request(app)
                .post('/api/videos')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Learn German Alphabet',
                    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    description: 'Alphabet pronunciation',
                    isPublic: true,
                });
            expect(createRes.status).toBe(201);
            const videoId = createRes.body.video.id || createRes.body.video._id;
            expect(createRes.body.video.youtubeVideoId).toBe('dQw4w9WgXcQ');

            // Fetch single video increments viewCount
            const getRes = await request(app)
                .get(`/api/videos/${videoId}`)
                .set('Authorization', `Bearer ${studentToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.video.viewCount).toBeGreaterThanOrEqual(1);

            // Activity summary
            const summaryRes = await request(app)
                .get('/api/activity/summary')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(summaryRes.status).toBe(200);
            expect(summaryRes.body.success).toBe(true);
        });
    });

    describe('6. CMS SEO Pages & Crawler Verification (/api/pages, /robots.txt, /sitemap.xml, /app-ads.txt)', () => {
        it('creates published page, serves public slug, and serves robots.txt, sitemap.xml, and app-ads.txt', async () => {
            const { token: adminToken } = await createTestAdmin();

            const pageRes = await request(app)
                .post('/api/pages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Learn German Online Free',
                    slug: 'learn-german-online-free',
                    content: '<h1>Welcome to LingoDolphy</h1>',
                    metaTitle: 'Learn German Online | DolphinCoder',
                    metaDescription: 'Interactive German lessons.',
                    status: 'published',
                });
            expect(pageRes.status).toBe(201);

            // Public fetch by slug
            const pubRes = await request(app).get('/api/pages/public/learn-german-online-free');
            expect(pubRes.status).toBe(200);
            expect(pubRes.body.page.title).toBe('Learn German Online Free');

            // Crawler endpoints
            const robotsRes = await request(app).get('/robots.txt');
            expect(robotsRes.status).toBe(200);
            expect(robotsRes.text).toContain('Sitemap:');

            const sitemapRes = await request(app).get('/sitemap.xml');
            expect(sitemapRes.status).toBe(200);
            expect(sitemapRes.text).toContain('<urlset');
            expect(sitemapRes.text).toContain('learn-german-online-free');

            const adsRes = await request(app).get('/app-ads.txt');
            expect(adsRes.status).toBe(200);
            expect(adsRes.text).toContain('google.com, pub-');
        });
    });
});
