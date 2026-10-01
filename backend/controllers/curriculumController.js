const CurriculumLesson = require('../models/CurriculumLesson');
const Note = require('../models/Note');
const { Op } = require('sequelize');

// Helper to determine if user has trainer or admin role
const isStaff = (user) => user && (user.role === 'trainer' || user.role === 'admin');

// 1. Get all lessons with multi-language & CEFR level filtering
exports.getLessons = async (req, res, next) => {
    try {
        const {
            learningLanguage = 'de',
            nativeLanguage = 'en',
            level = 'A1',
            unitNumber,
            isLive,
        } = req.query;

        const where = {
            learningLanguage,
            nativeLanguage,
            level,
        };

        if (unitNumber !== undefined && unitNumber !== '') {
            where.unitNumber = parseInt(unitNumber, 10);
        }

        // If user is a student (not staff), enforce isLive: true
        if (!isStaff(req.user)) {
            where.isLive = true;
        } else if (isLive !== undefined && isLive !== '') {
            where.isLive = isLive === 'true' || isLive === true;
        }

        const lessons = await CurriculumLesson.findAll({
            where,
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
            include: [
                { model: Note, as: 'sourceNote', attributes: ['id', 'title', 'audioUrl', 'isKaraoke'] },
            ],
        });

        res.json({
            success: true,
            count: lessons.length,
            lessons,
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get single lesson by ID
exports.getLessonById = async (req, res, next) => {
    try {
        const lesson = await CurriculumLesson.findByPk(req.params.id, {
            include: [
                { model: Note, as: 'sourceNote', attributes: ['id', 'title', 'audioUrl', 'isKaraoke', 'karaokeData'] },
            ],
        });

        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        // Students can only see live lessons
        if (!isStaff(req.user) && !lesson.isLive) {
            return res.status(403).json({ success: false, message: 'This lesson is currently in draft mode' });
        }

        res.json({ success: true, lesson });
    } catch (error) {
        next(error);
    }
};

// 3. Create a single new lesson
exports.createLesson = async (req, res, next) => {
    try {
        const {
            learningLanguage = 'de',
            nativeLanguage = 'en',
            level = 'A1',
            unitNumber = 1,
            unitTitle = 'Coral Reef',
            unitDescription = 'Introductions & Daily Greetings',
            lessonIndex,
            title,
            subtitle = '',
            nodeType = 'lesson',
            xpReward = 15,
            pearlsReward = 5,
            isLive = false, // CRITICAL: Default OFF
            stages = [],
            karaokeData = null,
            audioUrl = null,
            sourceNoteId = null,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Lesson title is required' });
        }

        // Determine next lessonIndex if not provided
        let targetIndex = lessonIndex;
        if (targetIndex === undefined || targetIndex === null) {
            const maxLesson = await CurriculumLesson.findOne({
                where: { learningLanguage, nativeLanguage, level, unitNumber },
                order: [['lessonIndex', 'DESC']],
            });
            targetIndex = maxLesson ? maxLesson.lessonIndex + 1 : 0;
        }

        const lesson = await CurriculumLesson.create({
            owner: req.user.id,
            learningLanguage,
            nativeLanguage,
            level,
            unitNumber,
            unitTitle,
            unitDescription,
            lessonIndex: targetIndex,
            title: title.trim(),
            subtitle: subtitle.trim(),
            nodeType,
            xpReward,
            pearlsReward,
            isLive: Boolean(isLive), // Default false
            stages,
            karaokeData,
            audioUrl,
            sourceNoteId,
        });

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully (Default: Draft / Not Live)',
            lesson,
        });
    } catch (error) {
        next(error);
    }
};

// 4. Update an existing lesson
exports.updateLesson = async (req, res, next) => {
    try {
        const lesson = await CurriculumLesson.findByPk(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const fields = [
            'learningLanguage', 'nativeLanguage', 'level', 'unitNumber',
            'unitTitle', 'unitDescription', 'lessonIndex', 'title',
            'subtitle', 'nodeType', 'xpReward', 'pearlsReward', 'isLive',
            'stages', 'karaokeData', 'audioUrl', 'sourceNoteId',
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                lesson[field] = req.body[field];
            }
        });

        await lesson.save();

        res.json({
            success: true,
            message: 'Lesson updated successfully',
            lesson,
        });
    } catch (error) {
        next(error);
    }
};

// 5. Toggle Live / Draft status
exports.toggleLiveStatus = async (req, res, next) => {
    try {
        const lesson = await CurriculumLesson.findByPk(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const newStatus = req.body.isLive !== undefined 
            ? Boolean(req.body.isLive) 
            : !lesson.isLive;

        lesson.isLive = newStatus;
        await lesson.save();

        res.json({
            success: true,
            message: `Lesson is now ${newStatus ? 'LIVE 🟢' : 'DRAFT (Not Live) 🔒'}`,
            isLive: lesson.isLive,
            lesson,
        });
    } catch (error) {
        next(error);
    }
};

// 6. Delete a lesson
exports.deleteLesson = async (req, res, next) => {
    try {
        const lesson = await CurriculumLesson.findByPk(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        await lesson.destroy();
        res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// 7. Batch create outline headings for an entire unit in one go
exports.batchCreateHeadings = async (req, res, next) => {
    try {
        const {
            learningLanguage = 'de',
            nativeLanguage = 'en',
            level = 'A1',
            unitNumber = 1,
            unitTitle = 'Coral Reef',
            unitDescription = 'Introductions & Daily Greetings',
            headings = [], // Array of { title, nodeType, subtitle, xpReward } or strings
        } = req.body;

        if (!Array.isArray(headings) || headings.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide at least one lesson heading' });
        }

        // Find existing max index in this unit
        const maxLesson = await CurriculumLesson.findOne({
            where: { learningLanguage, nativeLanguage, level, unitNumber },
            order: [['lessonIndex', 'DESC']],
        });
        let startIndex = maxLesson ? maxLesson.lessonIndex + 1 : 0;

        const createdLessons = [];

        for (let i = 0; i < headings.length; i++) {
            const item = headings[i];
            const title = typeof item === 'string' ? item.trim() : (item.title || '').trim();
            if (!title) continue;

            const nodeType = typeof item === 'object' && item.nodeType ? item.nodeType : 'lesson';
            const subtitle = typeof item === 'object' && item.subtitle ? item.subtitle : '';
            const xpReward = typeof item === 'object' && item.xpReward ? item.xpReward : 15;

            // Seed default modular stages based on node type
            let defaultStages = [];
            if (nodeType === 'lesson') {
                defaultStages = [
                    {
                        type: 'word_match',
                        title: 'Match the word pairs',
                        pairs: [
                            { target: 'Guten Tag', native: 'Hello' },
                            { target: 'Danke', native: 'Thank you' },
                            { target: 'Bitte', native: 'Please' },
                            { target: 'Tschüss', native: 'Bye' },
                        ],
                    },
                    {
                        type: 'listen_tap',
                        title: 'Listen and tap what you hear',
                        targetSentence: 'Guten Tag, ich bin Anna',
                        tokens: ['Kaffee', 'Guten', 'Tag,', 'ich', 'bin', 'Anna'],
                        audioUrl: null,
                    },
                    {
                        type: 'sentence_builder',
                        title: 'Construct the German sentence',
                        prompt: 'Translate: "Good morning, how are you?"',
                        targetSentence: 'Guten Morgen, wie geht es dir?',
                        tokens: ['Guten', 'Morgen,', 'wie', 'geht', 'es', 'dir?', 'schlafe', 'Kalt'],
                    },
                    {
                        type: 'sprechen',
                        title: 'Pronounce Auf Deutsch',
                        prompt: 'Guten Tag! Wie geht es dir?',
                        translation: 'Hello! How are you?',
                        minAccuracy: 75,
                    },
                ];
            } else if (nodeType === 'karaoke') {
                defaultStages = [
                    {
                        type: 'karaoke',
                        title: 'Karaoke Synced Rhythm',
                        storyText: 'Hallo Welt. Wie geht es dir heute?',
                        translationText: 'Hello world. How are you today?',
                    },
                ];
            }

            const lesson = await CurriculumLesson.create({
                owner: req.user.id,
                learningLanguage,
                nativeLanguage,
                level,
                unitNumber,
                unitTitle,
                unitDescription,
                lessonIndex: startIndex + i,
                title,
                subtitle,
                nodeType,
                xpReward,
                pearlsReward: nodeType === 'chest' ? 30 : 5,
                isLive: false, // CRITICAL: Always default OFF
                stages: defaultStages,
            });

            createdLessons.push(lesson);
        }

        res.status(201).json({
            success: true,
            message: `Successfully created ${createdLessons.length} lesson headings as DRAFTS (Default OFF)`,
            count: createdLessons.length,
            lessons: createdLessons,
        });
    } catch (error) {
        next(error);
    }
};

// 8. Bulk upload lessons (JSON or CSV)
exports.bulkUpload = async (req, res, next) => {
    try {
        const {
            learningLanguage = 'de',
            nativeLanguage = 'en',
            level = 'A1',
            unitNumber = 1,
            unitTitle = 'Coral Reef',
            lessonsData, // Can be array of objects or CSV text
        } = req.body;

        let parsedItems = [];

        if (Array.isArray(lessonsData)) {
            parsedItems = lessonsData;
        } else if (typeof lessonsData === 'string') {
            // Check if JSON string
            try {
                const jsonParsed = JSON.parse(lessonsData);
                if (Array.isArray(jsonParsed)) {
                    parsedItems = jsonParsed;
                } else if (jsonParsed.lessons && Array.isArray(jsonParsed.lessons)) {
                    parsedItems = jsonParsed.lessons;
                }
            } catch {
                // Parse as CSV
                const lines = lessonsData.split(/\r?\n/).filter(line => line.trim());
                // Headers: Title, NodeType, Subtitle, XpReward, StagesSummary
                const startLine = lines[0].toLowerCase().includes('title') ? 1 : 0;
                for (let i = startLine; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    if (parts.length > 0 && parts[0]) {
                        parsedItems.push({
                            title: parts[0],
                            nodeType: parts[1] || 'lesson',
                            subtitle: parts[2] || '',
                            xpReward: parseInt(parts[3] || '15', 10),
                        });
                    }
                }
            }
        }

        if (parsedItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid lesson data found in upload' });
        }

        // Find existing max index in this unit
        const maxLesson = await CurriculumLesson.findOne({
            where: { learningLanguage, nativeLanguage, level, unitNumber },
            order: [['lessonIndex', 'DESC']],
        });
        let startIndex = maxLesson ? maxLesson.lessonIndex + 1 : 0;

        const createdLessons = [];

        for (let i = 0; i < parsedItems.length; i++) {
            const item = parsedItems[i];
            if (!item.title) continue;

            const lesson = await CurriculumLesson.create({
                owner: req.user.id,
                learningLanguage: item.learningLanguage || learningLanguage,
                nativeLanguage: item.nativeLanguage || nativeLanguage,
                level: item.level || level,
                unitNumber: item.unitNumber || unitNumber,
                unitTitle: item.unitTitle || unitTitle,
                unitDescription: item.unitDescription || '',
                lessonIndex: startIndex + i,
                title: item.title,
                subtitle: item.subtitle || '',
                nodeType: item.nodeType || 'lesson',
                xpReward: item.xpReward || 15,
                pearlsReward: item.pearlsReward || 5,
                isLive: false, // Always default OFF
                stages: item.stages || [],
                audioUrl: item.audioUrl || null,
            });

            createdLessons.push(lesson);
        }

        res.status(201).json({
            success: true,
            message: `Bulk uploaded ${createdLessons.length} lessons as DRAFTS (Default OFF)`,
            count: createdLessons.length,
            lessons: createdLessons,
        });
    } catch (error) {
        next(error);
    }
};

// 9. Get units summary with lesson counts and draft/live stats
exports.getUnitsSummary = async (req, res, next) => {
    try {
        const {
            learningLanguage = 'de',
            nativeLanguage = 'en',
            level = 'A1',
        } = req.query;

        const lessons = await CurriculumLesson.findAll({
            where: { learningLanguage, nativeLanguage, level },
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
            ],
        });

        // Group by unitNumber
        const unitsMap = {};
        lessons.forEach(l => {
            if (!unitsMap[l.unitNumber]) {
                unitsMap[l.unitNumber] = {
                    unitNumber: l.unitNumber,
                    unitTitle: l.unitTitle || `Unit ${l.unitNumber}`,
                    unitDescription: l.unitDescription || '',
                    totalLessons: 0,
                    liveLessons: 0,
                    draftLessons: 0,
                    lessons: [],
                };
            }
            unitsMap[l.unitNumber].totalLessons++;
            if (l.isLive) {
                unitsMap[l.unitNumber].liveLessons++;
            } else {
                unitsMap[l.unitNumber].draftLessons++;
            }
            unitsMap[l.unitNumber].lessons.push(l);
        });

        const units = Object.values(unitsMap).sort((a, b) => a.unitNumber - b.unitNumber);

        res.json({
            success: true,
            learningLanguage,
            nativeLanguage,
            level,
            totalUnits: units.length,
            units,
        });
    } catch (error) {
        next(error);
    }
};

// 10. Seed default Unit 1 if empty
exports.seedDefaultUnit = async (req, res, next) => {
    try {
        const count = await CurriculumLesson.count({
            where: { learningLanguage: 'de', level: 'A1', unitNumber: 1 },
        });

        if (count > 0) {
            return res.json({ success: true, message: 'Unit 1 already has lessons', count });
        }

        const defaultSeed = [
            {
                lessonIndex: 0,
                title: 'Basics & Greetings',
                subtitle: 'Essential German greetings & daily etiquette',
                nodeType: 'lesson',
                xpReward: 15,
                pearlsReward: 5,
                isLive: true, // Make the first one live as active demo
                stages: [
                    {
                        type: 'word_match',
                        title: 'Match the word pairs',
                        pairs: [
                            { target: 'Guten Tag', native: 'Hello' },
                            { target: 'Danke', native: 'Thank you' },
                            { target: 'Bitte', native: 'Please' },
                            { target: 'Tschüss', native: 'Bye' },
                        ],
                    },
                    {
                        type: 'listen_tap',
                        title: 'Listen and tap what you hear',
                        targetSentence: 'Guten Tag, ich bin Anna',
                        tokens: ['Kaffee', 'Guten', 'Tag,', 'ich', 'bin', 'Anna'],
                        audioUrl: null,
                    },
                    {
                        type: 'sentence_builder',
                        title: 'Construct the German sentence',
                        prompt: 'Translate: "Good morning, how are you?"',
                        targetSentence: 'Guten Morgen, wie geht es dir?',
                        tokens: ['Guten', 'Morgen,', 'wie', 'geht', 'es', 'dir?', 'schlafe', 'Kalt'],
                    },
                    {
                        type: 'sprechen',
                        title: 'Pronounce Auf Deutsch',
                        prompt: 'Guten Tag! Wie geht es dir?',
                        translation: 'Hello! How are you?',
                        minAccuracy: 75,
                    },
                ],
            },
            {
                lessonIndex: 1,
                title: 'Audio Karaoke Rhythm',
                subtitle: 'Word-by-word synced listening challenge',
                nodeType: 'karaoke',
                xpReward: 20,
                pearlsReward: 5,
                isLive: true,
                stages: [
                    {
                        type: 'karaoke',
                        title: 'Audio Karaoke Rhythm',
                        storyText: 'Guten Morgen Deutschland. Ein neuer Tag beginnt mit Musik und Freude.',
                        translationText: 'Good morning Germany. A new day begins with music and joy.',
                    },
                ],
            },
            {
                lessonIndex: 2,
                title: 'Sprechen Lip-Sync',
                subtitle: 'Voice dictation & pronunciation practice',
                nodeType: 'speech',
                xpReward: 25,
                pearlsReward: 5,
                isLive: false, // Draft / Default OFF
                stages: [
                    {
                        type: 'sprechen',
                        title: 'Pronounce Auf Deutsch',
                        prompt: 'Ich möchte einen Kaffee trinken, bitte.',
                        translation: 'I would like to drink a coffee, please.',
                        minAccuracy: 80,
                    },
                ],
            },
            {
                lessonIndex: 3,
                title: 'Sunken Treasure Chest',
                subtitle: 'Bonus 30 Pearls & 20 XP',
                nodeType: 'chest',
                xpReward: 20,
                pearlsReward: 30,
                isLive: true,
                stages: [],
            },
        ];

        const created = await Promise.all(defaultSeed.map(d => CurriculumLesson.create({
            owner: req.user.id,
            learningLanguage: 'de',
            nativeLanguage: 'en',
            level: 'A1',
            unitNumber: 1,
            unitTitle: 'Coral Reef',
            unitDescription: 'Introductions & Daily Greetings',
            ...d,
        })));

        res.status(201).json({
            success: true,
            message: 'Default Unit 1 seeded with initial curriculum nodes',
            count: created.length,
            lessons: created,
        });
    } catch (error) {
        next(error);
    }
};
