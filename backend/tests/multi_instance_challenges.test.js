const { sanitizeLessonStages } = require('../utils/stageSanitizer');
const CurriculumLesson = require('../models/CurriculumLesson');
const app = require('../server');
const { createTestUser, createTestAdmin } = require('./setup');
const http = require('http');
const { Duplex } = require('stream');

/**
 * In-process Express request helper for sandboxed test environments.
 * Intercepts res.write/res.end and feeds request payload streams directly,
 * avoiding loopback TCP/socket bind syscall restrictions.
 */
function request(appInstance) {
    const execute = (method, url) => {
        const headers = {
            host: 'localhost',
            'x-no-compression': 'true',
        };
        let body = null;

        const chain = {
            set(k, v) {
                if (typeof k === 'object') {
                    Object.assign(headers, k);
                } else {
                    headers[k.toLowerCase()] = v;
                }
                return chain;
            },
            send(data) {
                body = data;
                return chain;
            },
            then(resolve, reject) {
                return new Promise((resResolve, resReject) => {
                    const socket = new Duplex({
                        read() {},
                        write(chunk, enc, cb) { cb(); }
                    });
                    socket.remoteAddress = '127.0.0.1';

                    const req = new http.IncomingMessage(socket);
                    req.method = method;
                    req.url = url;

                    let payload = null;
                    if (body !== null && body !== undefined) {
                        if (typeof body === 'object') {
                            payload = Buffer.from(JSON.stringify(body));
                            headers['content-type'] = 'application/json';
                        } else {
                            payload = Buffer.from(String(body));
                        }
                        headers['content-length'] = String(payload.length);
                    }
                    req.headers = headers;

                    const res = new http.ServerResponse(req);
                    res.assignSocket(socket);

                    const bodyChunks = [];
                    const origWrite = res.write;
                    res.write = function(chunk, enc, cb) {
                        if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        return origWrite.call(this, chunk, enc, cb);
                    };

                    const origEnd = res.end;
                    res.end = function(chunk, enc, cb) {
                        if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        const ret = origEnd.call(this, chunk, enc, cb);

                        let parsedBody = null;
                        const fullBuf = Buffer.concat(bodyChunks);
                        try {
                            parsedBody = JSON.parse(fullBuf.toString());
                        } catch (_) {
                            parsedBody = fullBuf.toString();
                        }

                        resResolve({
                            status: res.statusCode,
                            statusCode: res.statusCode,
                            body: parsedBody,
                            headers: res.getHeaders ? res.getHeaders() : {},
                        });
                        return ret;
                    };

                    appInstance.handle(req, res, (err) => {
                        if (err) resReject(err);
                    });

                    process.nextTick(() => {
                        if (payload) {
                            req.push(payload);
                        }
                        req.push(null);
                    });
                }).then(resolve, reject);
            }
        };
        return chain;
    };

    return {
        get: (url) => execute('GET', url),
        post: (url) => execute('POST', url),
        put: (url) => execute('PUT', url),
        patch: (url) => execute('PATCH', url),
        delete: (url) => execute('DELETE', url),
    };
}

describe('Multi-Instance Repeated Challenges Backend Test Suite', () => {
    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
    });

    const createSampleRepeatedStages = () => [
        {
            id: 'wm_greetings_1',
            type: 'word_match',
            title: 'Basic Greetings',
            pairs: [
                { target: 'Hallo', native: 'Hello' },
                { target: 'Tschüss', native: 'Goodbye' },
            ],
        },
        {
            id: 'pic_food_1',
            type: 'picture_select',
            prompt: 'Select the apple',
            targetWord: 'der Apfel',
            options: [
                { id: 'opt_apple', text: 'Apfel', imageUrl: '/uploads/apple.webp', isCorrect: true },
                { id: 'opt_banana', text: 'Banane', imageUrl: '/uploads/banana.webp', isCorrect: false },
            ],
        },
        {
            id: 'listen_intro_1',
            type: 'listen_tap',
            targetSentence: 'Ich heiße Florian',
            tokens: ['Ich', 'heiße', 'Florian', 'Danke'],
        },
        {
            id: 'wm_farewells_2',
            type: 'word_match',
            title: 'Farewells and Courtesy',
            pairs: [
                { target: 'Danke', native: 'Thank you' },
                { target: 'Bitte', native: 'Please' },
                { target: 'Gute Nacht', native: 'Good night' },
            ],
        },
        {
            id: 'pic_drinks_2',
            type: 'picture_select',
            prompt: 'Select the water',
            targetWord: 'das Wasser',
            options: [
                { id: 'opt_water', text: 'Wasser', imageUrl: '/uploads/water.webp', isCorrect: true },
                { id: 'opt_coffee', text: 'Kaffee', imageUrl: '/uploads/coffee.webp', isCorrect: false },
            ],
        },
        {
            id: 'listen_dining_2',
            type: 'listen_tap',
            targetSentence: 'Ein Glas Wasser bitte',
            tokens: ['Ein', 'Glas', 'Wasser', 'bitte', 'Tee'],
        },
    ];

    /* ======================================================================
     * 1. stageSanitizer Zero-Deduplication & Order Preservation Tests
     * ====================================================================== */
    describe('1. stageSanitizer Multi-Instance Validation', () => {
        it('preserves interleaved repeated challenge stages without deduplication', () => {
            const rawStages = createSampleRepeatedStages();
            const sanitized = sanitizeLessonStages(rawStages);

            expect(sanitized).toHaveLength(6);
            expect(sanitized.map(s => s.type)).toEqual([
                'word_match',
                'picture_select',
                'listen_tap',
                'word_match',
                'picture_select',
                'listen_tap',
            ]);

            // Verify unique identifiers and payloads are preserved exactly
            expect(sanitized[0].id).toBe('wm_greetings_1');
            expect(sanitized[0].pairs).toEqual([
                { target: 'Hallo', native: 'Hello' },
                { target: 'Tschüss', native: 'Goodbye' },
            ]);

            expect(sanitized[1].id).toBe('pic_food_1');
            expect(sanitized[1].targetWord).toBe('der Apfel');

            expect(sanitized[2].id).toBe('listen_intro_1');
            expect(sanitized[2].targetSentence).toBe('Ich heiße Florian');

            expect(sanitized[3].id).toBe('wm_farewells_2');
            expect(sanitized[3].pairs).toEqual([
                { target: 'Danke', native: 'Thank you' },
                { target: 'Bitte', native: 'Please' },
                { target: 'Gute Nacht', native: 'Good night' },
            ]);

            expect(sanitized[4].id).toBe('pic_drinks_2');
            expect(sanitized[4].targetWord).toBe('das Wasser');

            expect(sanitized[5].id).toBe('listen_dining_2');
            expect(sanitized[5].targetSentence).toBe('Ein Glas Wasser bitte');
        });

        it('preserves back-to-back consecutive identical challenge instances', () => {
            const consecutiveStages = [
                {
                    id: 'wm_1',
                    type: 'word_match',
                    pairs: [
                        { target: 'Eins', native: 'One' },
                        { target: 'Zwei', native: 'Two' },
                    ],
                },
                {
                    id: 'wm_2',
                    type: 'word_match',
                    pairs: [
                        { target: 'Drei', native: 'Three' },
                        { target: 'Vier', native: 'Four' },
                    ],
                },
                {
                    id: 'pic_1',
                    type: 'picture_select',
                    options: [
                        { text: 'Katze', imageUrl: 'cat.webp', isCorrect: true },
                        { text: 'Hund', imageUrl: 'dog.webp', isCorrect: false },
                    ],
                },
                {
                    id: 'pic_2',
                    type: 'picture_select',
                    options: [
                        { text: 'Vogel', imageUrl: 'bird.webp', isCorrect: true },
                        { text: 'Fisch', imageUrl: 'fish.webp', isCorrect: false },
                    ],
                },
                {
                    id: 'listen_1',
                    type: 'listen_tap',
                    targetSentence: 'Guten Morgen',
                    tokens: ['Guten', 'Morgen'],
                },
                {
                    id: 'listen_2',
                    type: 'listen_tap',
                    targetSentence: 'Guten Abend',
                    tokens: ['Guten', 'Abend'],
                },
            ];

            const sanitized = sanitizeLessonStages(consecutiveStages);
            expect(sanitized).toHaveLength(6);
            expect(sanitized.map(s => s.id)).toEqual([
                'wm_1', 'wm_2', 'pic_1', 'pic_2', 'listen_1', 'listen_2'
            ]);
            expect(sanitized[0].pairs[0].target).toBe('Eins');
            expect(sanitized[1].pairs[0].target).toBe('Drei');
            expect(sanitized[2].options[0].text).toBe('Katze');
            expect(sanitized[3].options[0].text).toBe('Vogel');
            expect(sanitized[4].targetSentence).toBe('Guten Morgen');
            expect(sanitized[5].targetSentence).toBe('Guten Abend');
        });

        it('normalizes legacy aliases while preserving multiple instances and unique data', () => {
            const legacyRepeated = [
                {
                    instanceId: 'legacy_match_1',
                    type: 'match_pairs',
                    pairs: [
                        { german: 'Rot', english: 'Red' },
                        { german: 'Grün', english: 'Green' },
                    ],
                },
                {
                    instanceId: 'legacy_match_2',
                    type: 'word_match',
                    pairs: [
                        { target: 'Blau', native: 'Blue' },
                        { target: 'Gelb', native: 'Yellow' },
                    ],
                },
                {
                    instanceId: 'legacy_pic_1',
                    type: 'picture_cards',
                    options: [{ word: 'Sonne', image: 'sun.webp' }],
                },
                {
                    instanceId: 'legacy_pic_2',
                    type: 'picture_select',
                    options: [{ text: 'Mond', imageUrl: 'moon.webp' }],
                },
            ];

            const sanitized = sanitizeLessonStages(legacyRepeated);
            expect(sanitized).toHaveLength(4);
            expect(sanitized[0].type).toBe('word_match');
            expect(sanitized[0].instanceId).toBe('legacy_match_1');
            expect(sanitized[1].type).toBe('word_match');
            expect(sanitized[1].instanceId).toBe('legacy_match_2');
            expect(sanitized[2].type).toBe('picture_select');
            expect(sanitized[2].instanceId).toBe('legacy_pic_1');
            expect(sanitized[3].type).toBe('picture_select');
            expect(sanitized[3].instanceId).toBe('legacy_pic_2');
        });

        it('selectively purges an invalid duplicate while retaining valid instances of the same type', () => {
            const mixedValidityStages = [
                {
                    id: 'wm_valid_1',
                    type: 'word_match',
                    pairs: [
                        { target: 'Ja', native: 'Yes' },
                        { target: 'Bitte', native: 'Please' },
                    ],
                },
                {
                    id: 'wm_invalid_blank',
                    type: 'word_match',
                    pairs: [{ target: '   ', native: '   ' }], // Should be stripped
                },
                {
                    id: 'wm_valid_2',
                    type: 'word_match',
                    pairs: [
                        { target: 'Nein', native: 'No' },
                        { target: 'Danke', native: 'Thanks' },
                    ],
                },
            ];

            const sanitized = sanitizeLessonStages(mixedValidityStages);
            expect(sanitized).toHaveLength(2);
            expect(sanitized[0].id).toBe('wm_valid_1');
            expect(sanitized[0].pairs[0].target).toBe('Ja');
            expect(sanitized[1].id).toBe('wm_valid_2');
            expect(sanitized[1].pairs[0].target).toBe('Nein');
        });

        it('parses JSON string containing repeated challenge instances', () => {
            const rawStages = createSampleRepeatedStages();
            const stringified = JSON.stringify(rawStages);
            const sanitized = sanitizeLessonStages(stringified);

            expect(sanitized).toHaveLength(6);
            expect(sanitized[0].id).toBe('wm_greetings_1');
            expect(sanitized[3].id).toBe('wm_farewells_2');
        });
    });

    /* ======================================================================
     * 2. Lesson Creation with Multi-Instance Challenges
     * ====================================================================== */
    describe('2. POST /api/curriculum/lessons with Multi-Instance Stages', () => {
        it('persists repeated challenge stages in exact order with distinct payloads', async () => {
            const { token: adminToken } = await createTestAdmin();
            const sampleStages = createSampleRepeatedStages();

            const res = await request(app)
                .post('/api/curriculum/lessons')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Multi-Challenge Flow Lesson',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    isLive: true,
                    stages: sampleStages,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            const lesson = res.body.lesson;
            expect(lesson.stages).toHaveLength(6);

            // Verify in-memory database persistence
            const savedLesson = await CurriculumLesson.findByPk(lesson.id);
            expect(savedLesson).not.toBeNull();
            expect(savedLesson.stages).toHaveLength(6);
            expect(savedLesson.stages.map(s => s.id)).toEqual([
                'wm_greetings_1',
                'pic_food_1',
                'listen_intro_1',
                'wm_farewells_2',
                'pic_drinks_2',
                'listen_dining_2',
            ]);
            expect(savedLesson.stages[0].pairs[0].target).toBe('Hallo');
            expect(savedLesson.stages[3].pairs[0].target).toBe('Danke');
        });
    });

    /* ======================================================================
     * 3. Bulk Upload with Multi-Instance Challenges
     * ====================================================================== */
    describe('3. POST /api/curriculum/bulk-upload with Repeated Challenges', () => {
        it('bulk uploads lessons with repeated challenge instances without dropping any stages', async () => {
            const { token: adminToken } = await createTestAdmin();
            const sampleStages = createSampleRepeatedStages();

            const uploadPayload = {
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 2,
                unitTitle: 'Deep Sea Adventures',
                lessonsData: [
                    {
                        title: 'Lesson With Interleaved Challenges',
                        subtitle: 'Repeated Word Match, Picture Select & Listen Tap',
                        nodeType: 'lesson',
                        xpReward: 25,
                        stages: sampleStages,
                    },
                    {
                        title: 'Lesson With Back-to-Back Challenges',
                        subtitle: '2x Word Match in a row',
                        nodeType: 'lesson',
                        stages: [
                            sampleStages[0],
                            sampleStages[3],
                        ],
                    },
                ],
            };

            const res = await request(app)
                .post('/api/curriculum/bulk-upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(uploadPayload);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);

            const [lesson1, lesson2] = res.body.lessons;
            expect(lesson1.stages).toHaveLength(6);
            expect(lesson1.stages.map(s => s.id)).toEqual([
                'wm_greetings_1',
                'pic_food_1',
                'listen_intro_1',
                'wm_farewells_2',
                'pic_drinks_2',
                'listen_dining_2',
            ]);

            expect(lesson2.stages).toHaveLength(2);
            expect(lesson2.stages[0].id).toBe('wm_greetings_1');
            expect(lesson2.stages[1].id).toBe('wm_farewells_2');
        });

        it('accepts bulk upload payload as JSON stringified format', async () => {
            const { token: adminToken } = await createTestAdmin();
            const sampleStages = createSampleRepeatedStages();

            const jsonLessons = [
                {
                    title: 'Stringified JSON Bulk Upload',
                    unitNumber: 3,
                    stages: sampleStages,
                },
            ];

            const res = await request(app)
                .post('/api/curriculum/bulk-upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 3,
                    lessonsData: JSON.stringify(jsonLessons),
                });

            expect(res.status).toBe(201);
            expect(res.body.count).toBe(1);
            expect(res.body.lessons[0].stages).toHaveLength(6);
            expect(res.body.lessons[0].stages[0].id).toBe('wm_greetings_1');
            expect(res.body.lessons[0].stages[3].id).toBe('wm_farewells_2');
        });
    });

    /* ======================================================================
     * 4. API Retrieval for Learners & Staff
     * ====================================================================== */
    describe('4. API Retrieval of Multi-Instance Challenges', () => {
        it('retrieves distinct repeated challenge stages via /api/curriculum/lessons/:id', async () => {
            const { user: adminUser, token: adminToken } = await createTestAdmin();
            const sampleStages = createSampleRepeatedStages();

            const created = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Curriculum API Retrieve Test',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                isLive: true,
                stages: sampleStages,
            });

            const res = await request(app)
                .get(`/api/curriculum/lessons/${created.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const stages = res.body.lesson.stages;
            expect(stages).toHaveLength(6);
            expect(stages[0].id).toBe('wm_greetings_1');
            expect(stages[1].id).toBe('pic_food_1');
            expect(stages[2].id).toBe('listen_intro_1');
            expect(stages[3].id).toBe('wm_farewells_2');
            expect(stages[4].id).toBe('pic_drinks_2');
            expect(stages[5].id).toBe('listen_dining_2');
        });

        it('delivers all repeated challenge instances to learners via /api/gamification/lesson/:id', async () => {
            const { user: adminUser } = await createTestAdmin();
            const { token: studentToken } = await createTestUser();
            const sampleStages = createSampleRepeatedStages();

            const created = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Gamification API Retrieve Test',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                isLive: true,
                stages: sampleStages,
            });

            const res = await request(app)
                .get(`/api/gamification/lesson/${created.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const stages = res.body.lesson.stages;
            expect(stages).toHaveLength(6);
            expect(stages[0].id).toBe('wm_greetings_1');
            expect(stages[0].pairs).toEqual(sampleStages[0].pairs);
            expect(stages[3].id).toBe('wm_farewells_2');
            expect(stages[3].pairs).toEqual(sampleStages[3].pairs);
        });

        it('preserves multi-instance stages when updating an existing lesson', async () => {
            const { user: adminUser, token: adminToken } = await createTestAdmin();
            const sampleStages = createSampleRepeatedStages();

            const created = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Pre-update Lesson',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                isLive: true,
                stages: [sampleStages[0]], // Initially only 1 stage
            });

            // Update with all 6 repeated stages
            const updateRes = await request(app)
                .put(`/api/curriculum/lessons/${created.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    stages: sampleStages,
                });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.success).toBe(true);
            expect(updateRes.body.lesson.stages).toHaveLength(6);
            expect(updateRes.body.lesson.stages[0].id).toBe('wm_greetings_1');
            expect(updateRes.body.lesson.stages[3].id).toBe('wm_farewells_2');

            // Verify database reflection
            const reloaded = await CurriculumLesson.findByPk(created.id);
            expect(reloaded.stages).toHaveLength(6);
            expect(reloaded.stages[4].id).toBe('pic_drinks_2');
            expect(reloaded.stages[5].id).toBe('listen_dining_2');
        });
    });
});
