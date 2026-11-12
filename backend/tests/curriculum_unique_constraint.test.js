const { sequelize } = require('../config/database');
const CurriculumLesson = require('../models/CurriculumLesson');
const User = require('../models/User');

describe('DB-03: CurriculumLesson Composite Unique Constraint & Idempotency Suite', () => {
    let testOwnerId = 1;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        const user = await User.create({
            name: 'Curriculum Admin',
            email: `curr_admin_${Date.now()}@test.com`,
            password: 'HashedPassword123!',
            role: 'admin',
        });
        testOwnerId = user.id;
    });

    afterAll(async () => {
        try {
            await sequelize.close();
        } catch (_) {}
    });

    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {}, force: true });
    });

    test('1. Successfully creates an initial curriculum lesson node', async () => {
        const lesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            unitTitle: 'Coral Reef',
            lessonIndex: 0,
            title: 'Basics 1',
            nodeType: 'lesson',
            isLive: true,
        });

        expect(lesson).toBeDefined();
        expect(lesson.id).toBeGreaterThan(0);
        expect(lesson.lessonIndex).toBe(0);
        expect(lesson.unitNumber).toBe(1);
    });

    test('2. Rejects duplicate lesson at same (learningLanguage, nativeLanguage, level, unitNumber, lessonIndex) with SequelizeUniqueConstraintError', async () => {
        // Create initial node
        await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            unitTitle: 'Coral Reef',
            lessonIndex: 0,
            title: 'First Lesson',
            nodeType: 'lesson',
        });

        // Attempt to insert duplicate lesson at same logical node position
        let error = null;
        try {
            await CurriculumLesson.create({
                owner: testOwnerId,
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                unitTitle: 'Coral Reef Duplicate',
                lessonIndex: 0,
                title: 'Duplicate Lesson Attempt',
                nodeType: 'lesson',
            });
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeNull();
        expect(error.name).toBe('SequelizeUniqueConstraintError');

        // Total count in DB must remain exactly 1
        const count = await CurriculumLesson.count();
        expect(count).toBe(1);
    });

    test('3. Allows distinct lessonIndex within the same unit', async () => {
        await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 0,
            title: 'Lesson 0',
        });

        const lesson1 = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 1,
            title: 'Lesson 1',
        });

        expect(lesson1).toBeDefined();
        expect(lesson1.lessonIndex).toBe(1);
        const count = await CurriculumLesson.count();
        expect(count).toBe(2);
    });

    test('4. Allows same lessonIndex across different units', async () => {
        await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 0,
            title: 'Unit 1 Lesson 0',
        });

        const unit2Lesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 2,
            lessonIndex: 0,
            title: 'Unit 2 Lesson 0',
        });

        expect(unit2Lesson).toBeDefined();
        expect(unit2Lesson.unitNumber).toBe(2);
        const count = await CurriculumLesson.count();
        expect(count).toBe(2);
    });

    test('5. Allows same lessonIndex and unitNumber across different language tracks', async () => {
        await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 0,
            title: 'German from English',
        });

        const hindiTrackLesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'en',
            nativeLanguage: 'hi',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 0,
            title: 'English from Hindi',
        });

        expect(hindiTrackLesson).toBeDefined();
        expect(hindiTrackLesson.learningLanguage).toBe('en');
        expect(hindiTrackLesson.nativeLanguage).toBe('hi');
        const count = await CurriculumLesson.count();
        expect(count).toBe(2);
    });

    test('6. bulkCreate with updateOnDuplicate executes idempotent update without multiplying rows', async () => {
        const initialBatch = [
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'hi',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                title: 'Original Title 0',
                xpReward: 15,
                pearlsReward: 5,
            },
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'hi',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 1,
                title: 'Original Title 1',
                xpReward: 15,
                pearlsReward: 5,
            },
        ];

        await CurriculumLesson.bulkCreate(initialBatch);
        expect(await CurriculumLesson.count()).toBe(2);

        // Re-seeding the same chunk with updated titles
        const updatedBatch = [
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'hi',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                title: 'Updated Title 0',
                xpReward: 20,
                pearlsReward: 10,
            },
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'hi',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 1,
                title: 'Updated Title 1',
                xpReward: 20,
                pearlsReward: 10,
            },
        ];

        await CurriculumLesson.bulkCreate(updatedBatch, {
            updateOnDuplicate: ['title', 'xpReward', 'pearlsReward'],
        });

        // Row count must NOT increase
        const finalCount = await CurriculumLesson.count();
        expect(finalCount).toBe(2);

        // Titles must be updated
        const lesson0 = await CurriculumLesson.findOne({ where: { lessonIndex: 0 } });
        expect(lesson0.title).toBe('Updated Title 0');
        expect(lesson0.xpReward).toBe(20);
    });

    test('7. bulkCreate with ignoreDuplicates safely skips duplicates without throwing', async () => {
        await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'en',
            nativeLanguage: 'mr',
            level: 'A1',
            unitNumber: 1,
            lessonIndex: 0,
            title: 'Existing Lesson',
        });

        const duplicateBatch = [
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'mr',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                title: 'Duplicate Attempt Should Be Ignored',
            },
            {
                owner: testOwnerId,
                learningLanguage: 'en',
                nativeLanguage: 'mr',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 1,
                title: 'New Unique Lesson',
            },
        ];

        await CurriculumLesson.bulkCreate(duplicateBatch, { ignoreDuplicates: true });

        // Total count should now be 2 (1 existing + 1 new, duplicate ignored)
        const finalCount = await CurriculumLesson.count();
        expect(finalCount).toBe(2);
    });

    test('8. Preserves the Slipstream B-Tree compound index alongside unique composite index', () => {
        const indexes = CurriculumLesson.options.indexes || [];

        // Verify Slipstream index exists
        const slipstreamIndex = indexes.find(idx => {
            const fields = idx.fields || [];
            return (
                fields.length === 5 &&
                fields[0] === 'learningLanguage' &&
                fields[1] === 'nativeLanguage' &&
                fields[2] === 'level' &&
                fields[3] === 'isLive' &&
                fields[4] === 'unitNumber'
            );
        });
        expect(slipstreamIndex).toBeDefined();

        // Verify new composite unique index exists
        const uniqueIndex = indexes.find(idx => idx.name === 'unique_curriculum_lesson_node');
        expect(uniqueIndex).toBeDefined();
        expect(uniqueIndex.unique).toBe(true);
        expect(uniqueIndex.fields).toEqual([
            'learningLanguage',
            'nativeLanguage',
            'level',
            'sectionNumber',
            'unitNumber',
            'lessonIndex',
        ]);
    });

    test('9. Allows same unitNumber (1-12) across different sections (sectionNumber 1, 2, 3) within the same level', async () => {
        const sec1Lesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'en',
            nativeLanguage: 'hi',
            level: 'A1',
            sectionNumber: 1,
            sectionTitle: 'Rookie',
            unitNumber: 1,
            unitTitle: 'Greetings',
            lessonIndex: 0,
            title: 'Section 1 Unit 1 Lesson 0',
        });

        const sec2Lesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'en',
            nativeLanguage: 'hi',
            level: 'A1',
            sectionNumber: 2,
            sectionTitle: 'Explorer',
            unitNumber: 1,
            unitTitle: 'Daily Routines',
            lessonIndex: 0,
            title: 'Section 2 Unit 1 Lesson 0',
        });

        const sec3Lesson = await CurriculumLesson.create({
            owner: testOwnerId,
            learningLanguage: 'en',
            nativeLanguage: 'hi',
            level: 'A1',
            sectionNumber: 3,
            sectionTitle: 'Traveler',
            unitNumber: 1,
            unitTitle: 'In Town',
            lessonIndex: 0,
            title: 'Section 3 Unit 1 Lesson 0',
        });

        expect(sec1Lesson.sectionNumber).toBe(1);
        expect(sec2Lesson.sectionNumber).toBe(2);
        expect(sec3Lesson.sectionNumber).toBe(3);
        expect(sec1Lesson.unitNumber).toBe(1);
        expect(sec2Lesson.unitNumber).toBe(1);
        expect(sec3Lesson.unitNumber).toBe(1);
        expect(await CurriculumLesson.count()).toBe(3);
    });
});
