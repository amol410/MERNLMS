const fs = require('fs');
const path = require('path');
const { validateLessonStages } = require('../utils/stageSanitizer');
const { flattenCurriculumJson } = require('../utils/curriculumSeeder');
const { sequelize } = require('../config/database');
const CurriculumLesson = require('../models/CurriculumLesson');

describe('Section 1 Curriculum Validation Suite (en_hi_a1)', () => {
    const section1File = path.join(__dirname, '../../syllabus/section_1_english_hindi.json');
    const unitsDir = path.join(__dirname, '../../syllabus/section_1');

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    test('Consolidated Section 1 JSON exists and has 12 units with 144 lessons', () => {
        expect(fs.existsSync(section1File)).toBe(true);
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));

        expect(data.learningLanguage).toBe('en');
        expect(data.nativeLanguage).toBe('hi');
        expect(data.level).toBe('A1');
        expect(data.totalUnits).toBe(12);
        expect(data.totalLessons).toBe(144);
        expect(data.units.length).toBe(12);
    });

    test('Each unit contains exactly 12 stepping stones with 2 chests and 1 milestone exam', () => {
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));

        data.units.forEach((unit, idx) => {
            expect(unit.unitNumber).toBe(idx + 1);
            expect(unit.lessonsData.length).toBe(12);

            // Lesson 6 (index 5) is Chest 1 with 25 pearls and 15 XP
            const chest1 = unit.lessonsData[5];
            expect(chest1.nodeType).toBe('chest');
            expect(chest1.pearlsReward).toBe(25);
            expect(chest1.xpReward).toBe(15);

            // Lesson 11 (index 10) is Chest 2 with 35 pearls and 20 XP
            const chest2 = unit.lessonsData[10];
            expect(chest2.nodeType).toBe('chest');
            expect(chest2.pearlsReward).toBe(35);
            expect(chest2.xpReward).toBe(20);

            // Lesson 12 (index 11) is Unit Milestone Exam
            const exam = unit.lessonsData[11];
            expect(exam.nodeType).toBe('quiz');
            expect(exam.xpReward).toBe(35);
        });
    });

    test('100% of interactive stages across all 144 lessons pass stageSanitizer validation', () => {
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));
        let totalStages = 0;

        data.units.forEach((unit) => {
            unit.lessonsData.forEach((lesson) => {
                if (lesson.stages && lesson.stages.length > 0) {
                    totalStages += lesson.stages.length;
                    const res = validateLessonStages(lesson.stages);
                    expect(res.isValid).toBe(true);
                    expect(res.errors).toEqual([]);
                }
            });
        });

        expect(totalStages).toBeGreaterThan(450);
    });

    test('All 12 individual unit JSON files exist in syllabus/section_1/ and match structure', () => {
        const expectedFiles = [
            'unit_01_objects_possessives.json',
            'unit_02_food_temperatures.json',
            'unit_03_family_identity.json',
            'unit_04_daily_verbs.json',
            'unit_05_numbers_plurals.json',
            'unit_06_home_prepositions.json',
            'unit_07_routines_time.json',
            'unit_08_colors_clothes.json',
            'unit_09_needs_courtesies.json',
            'unit_10_questions_directions.json',
            'unit_11_city_transit.json',
            'unit_12_feelings_graduation.json',
        ];

        expectedFiles.forEach((file, index) => {
            const filePath = path.join(unitsDir, file);
            expect(fs.existsSync(filePath)).toBe(true);

            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            expect(content.unitNumber).toBe(index + 1);
            expect(content.lessons.length).toBe(12);
            expect(content.lessonsCount).toBe(12);
        });
    });

    test('Every cloze stage has blank in options, 0 duplicate options, and 0 trailing punctuation', () => {
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));

        data.units.forEach((unit) => {
            unit.lessonsData.forEach((lesson) => {
                if (lesson.nodeType !== 'chest') {
                    const clozeStage = lesson.stages.find(s => s.type === 'cloze_test');
                    expect(clozeStage).toBeDefined();

                    // Blank must be in options
                    expect(clozeStage.options).toContain(clozeStage.blank);

                    // Exactly 3 unique options, 0 duplicates
                    expect(clozeStage.options.length).toBe(3);
                    const uniqueOpts = new Set(clozeStage.options);
                    expect(uniqueOpts.size).toBe(3);

                    // Blank and options must not have trailing punctuation
                    expect(clozeStage.blank).not.toMatch(/[.,!?:;]$/);
                    clozeStage.options.forEach((opt) => {
                        expect(opt).not.toMatch(/[.,!?:;]$/);
                    });

                    // Sentence must contain blank placeholder
                    expect(clozeStage.sentence).toContain('_______');
                }
            });
        });
    });

    test('All type_word stages use clean single-word targets with valid hints', () => {
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));

        data.units.forEach((unit) => {
            unit.lessonsData.forEach((lesson) => {
                if (lesson.nodeType !== 'chest') {
                    const typeStage = lesson.stages.find(s => s.type === 'type_word');
                    expect(typeStage).toBeDefined();
                    expect(typeStage.target.split(' ').length).toBe(1);
                    expect(typeStage.target).not.toMatch(/[.,!?:;]$/);
                    expect(typeStage.hint).toBeDefined();
                }
            });
        });
    });

    test('Curriculum flattens cleanly and bulk creates into database without error', async () => {
        const data = JSON.parse(fs.readFileSync(section1File, 'utf8'));
        const flattened = flattenCurriculumJson(data, 1);

        expect(flattened.length).toBe(144);

        const created = await CurriculumLesson.bulkCreate(flattened);
        expect(created.length).toBe(144);

        const dbCount = await CurriculumLesson.count({
            where: { learningLanguage: 'en', nativeLanguage: 'hi', level: 'A1' }
        });
        expect(dbCount).toBe(144);
    });
});
