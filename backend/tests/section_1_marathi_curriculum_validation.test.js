const fs = require('fs');
const path = require('path');
const { validateLessonStages } = require('../utils/stageSanitizer');
const { sequelize } = require('../config/database');
const CurriculumLesson = require('../models/CurriculumLesson');

describe('Section 1 English for Marathi Speakers Curriculum Validation Suite (en_mr_a1)', () => {
    const section1MarathiFile = path.join(__dirname, '../../syllabus/section_1_english_marathi.json');
    const unitsDir = path.join(__dirname, '../../syllabus/section_1_marathi');

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    test('Consolidated Section 1 Marathi JSON exists and has 12 units with 144 lessons', () => {
        expect(fs.existsSync(section1MarathiFile)).toBe(true);
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));

        expect(data.learningLanguage).toBe('en');
        expect(data.nativeLanguage).toBe('mr');
        expect(data.level).toBe('A1');
        expect(data.totalUnits).toBe(12);
        expect(data.totalLessons).toBe(144);
        expect(data.units.length).toBe(12);
    });

    test('Each unit contains exactly 12 stepping stones with 2 chests and 1 milestone exam', () => {
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));

        data.units.forEach((unit, idx) => {
            expect(unit.unitNumber).toBe(idx + 1);
            expect(unit.lessonsData.length).toBe(12);

            // Lesson 6 (index 5) is Chest 1 with 25 pearls and 15 XP
            const chest1 = unit.lessonsData[5];
            expect(chest1.nodeType).toBe('chest');
            expect(chest1.pearlsReward).toBe(25);
            expect(chest1.xpReward).toBe(15);
            expect(chest1.stages.length).toBe(0);

            // Lesson 11 (index 10) is Chest 2 with 35 pearls and 20 XP
            const chest2 = unit.lessonsData[10];
            expect(chest2.nodeType).toBe('chest');
            expect(chest2.pearlsReward).toBe(35);
            expect(chest2.xpReward).toBe(20);
            expect(chest2.stages.length).toBe(0);

            // Lesson 12 (index 11) is Unit Milestone Exam
            const exam = unit.lessonsData[11];
            expect(exam.nodeType).toBe('quiz');
            expect(exam.xpReward).toBe(35);
            expect(exam.pearlsReward).toBe(10);
            expect(exam.stages.length).toBe(10);
        });
    });

    test('Every interactive lesson contains all 10 modular challenges and 100% pass validateLessonStages', () => {
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));
        let totalStages = 0;
        let interactiveLessons = 0;

        const expectedStageTypes = [
            'picture_select',
            'word_match',
            'sentence_builder',
            'cloze_test',
            'listen_tap',
            'listen_select',
            'type_word',
            'dialogue_bubble',
            'sprechen',
            'karaoke',
        ];

        data.units.forEach((unit) => {
            unit.lessonsData.forEach((lesson) => {
                if (lesson.nodeType !== 'chest') {
                    interactiveLessons++;
                    expect(lesson.stages).toBeDefined();
                    expect(lesson.stages.length).toBe(10);

                    // Verify each challenge type is present
                    const stageTypes = lesson.stages.map(s => s.type);
                    expect(stageTypes).toEqual(expectedStageTypes);

                    // Verify picture_select is unticked (enabled: false)
                    const picStage = lesson.stages.find(s => s.type === 'picture_select');
                    expect(picStage.enabled).toBe(false);
                    expect(picStage.options.length).toBe(3);

                    // Verify stages pass sanitizer validation
                    totalStages += lesson.stages.length;
                    const res = validateLessonStages(lesson.stages);
                    expect(res.isValid).toBe(true);
                    expect(res.errors).toEqual([]);
                }
            });
        });

        expect(interactiveLessons).toBe(120); // 10 interactive lessons * 12 units
        expect(totalStages).toBe(1200); // 120 * 10
    });

    test('Marathi grammar, gender markers and localized vocabulary are properly integrated', () => {
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));

        // Unit 1: Check Marathi noun genders (घर, गाडी)
        const unit1 = data.units.find(u => u.unitNumber === 1);
        expect(unit1).toBeDefined();
        const unit1Json = JSON.stringify(unit1);
        expect(unit1Json).toContain('घर');
        expect(unit1Json).toContain('गाडी');
        expect(unit1Json).toContain('माझे');
        expect(unit1Json).toContain('माझी');

        // Unit 2: Food & drinks (पाणी, चहा, कॉफी, दूध)
        const unit2 = data.units.find(u => u.unitNumber === 2);
        const unit2Json = JSON.stringify(unit2);
        expect(unit2Json).toContain('पाणी');
        expect(unit2Json).toContain('चहा');
        expect(unit2Json).toContain('दूध');

        // Unit 3: Family (आई, वडील, भाऊ, बहीण)
        const unit3 = data.units.find(u => u.unitNumber === 3);
        const unit3Json = JSON.stringify(unit3);
        expect(unit3Json).toContain('आई');
        expect(unit3Json).toContain('वडील');
        expect(unit3Json).toContain('भाऊ');
        expect(unit3Json).toContain('बहीण');

        // Unit 11: Places & transit (पुणे/पुण्यासाठी, स्टेशन, बस, रिक्षा)
        const unit11 = data.units.find(u => u.unitNumber === 11);
        const unit11Json = JSON.stringify(unit11);
        expect(unit11Json).toContain('पुण्या');
        expect(unit11Json).toContain('स्टेशन');
        expect(unit11Json).toContain('रिक्षा');
    });

    test('All 12 individual unit JSON files exist in syllabus/section_1_marathi/ and match structure', () => {
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
            expect(content.learningLanguage).toBe('en');
            expect(content.nativeLanguage).toBe('mr');
            expect(content.level).toBe('A1');
            expect(content.unitNumber).toBe(index + 1);
            expect(content.lessons.length).toBe(12);
            expect(content.lessonsCount).toBe(12);
        });
    });

    test('Every cloze stage has blank in options, 0 duplicate options, and 0 trailing punctuation', () => {
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));

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
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));

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

    test('Curriculum lessons bulk-insert cleanly into database without error', async () => {
        const data = JSON.parse(fs.readFileSync(section1MarathiFile, 'utf8'));
        const unit1 = data.units[0];

        const createdLessons = [];
        for (const l of unit1.lessonsData) {
            const created = await CurriculumLesson.create({
                owner: 1,
                learningLanguage: 'en',
                nativeLanguage: 'mr',
                level: 'A1',
                unitNumber: 1,
                unitTitle: unit1.unitTitle,
                unitDescription: unit1.unitDescription,
                lessonIndex: l.lessonIndex,
                title: l.title,
                subtitle: l.subtitle,
                nodeType: l.nodeType,
                xpReward: l.xpReward,
                pearlsReward: l.pearlsReward,
                isLive: true,
                stages: l.stages,
            });
            createdLessons.push(created);
        }

        expect(createdLessons.length).toBe(12);
        const count = await CurriculumLesson.count({
            where: { learningLanguage: 'en', nativeLanguage: 'mr', level: 'A1', unitNumber: 1 },
        });
        expect(count).toBe(12);
    });
});
