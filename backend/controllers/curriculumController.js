const CurriculumLesson = require('../models/CurriculumLesson');
const Note = require('../models/Note');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { sanitizeLessonStages, validateLessonStages } = require('../utils/stageSanitizer');

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
            sectionNumber,
            isLive,
        } = req.query;

        const where = {
            learningLanguage,
            nativeLanguage,
            level,
        };

        if (unitNumber !== undefined && unitNumber !== '') {
            where.unitNumber = parseInt(unitNumber, 10);
        } else if (sectionNumber !== undefined && sectionNumber !== '') {
            const sec = parseInt(sectionNumber, 10);
            const minUnit = sec === 1 ? 1 : (sec === 2 ? 36 : 71);
            const maxUnit = sec === 1 ? 35 : (sec === 2 ? 70 : 105);
            where.unitNumber = { [Op.between]: [minUnit, maxUnit] };
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

        const lessonData = lesson.toJSON ? lesson.toJSON() : { ...lesson };
        lessonData.stages = sanitizeLessonStages(lessonData.stages);

        res.json({ success: true, lesson: lessonData });
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

        if (stages && stages.length > 0) {
            const validation = validateLessonStages(stages);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Malformed challenge schema: ${validation.errors.join('; ')}`,
                    errors: validation.errors,
                });
            }
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

        const cleanStages = sanitizeLessonStages(stages);

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
            stages: cleanStages,
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

        if (req.body.stages && req.body.stages.length > 0) {
            const validation = validateLessonStages(req.body.stages);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Malformed challenge schema: ${validation.errors.join('; ')}`,
                    errors: validation.errors,
                });
            }
        }

        const fields = [
            'learningLanguage', 'nativeLanguage', 'level', 'unitNumber',
            'unitTitle', 'unitDescription', 'lessonIndex', 'title',
            'subtitle', 'nodeType', 'xpReward', 'pearlsReward', 'isLive',
            'stages', 'karaokeData', 'audioUrl', 'sourceNoteId',
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'stages') {
                    lesson.stages = sanitizeLessonStages(req.body.stages);
                } else {
                    lesson[field] = req.body[field];
                }
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
            lessonsData, // Can be array of objects, JSON string, or CSV text
        } = req.body;

        let effectiveLearningLanguage = learningLanguage;
        let effectiveNativeLanguage = nativeLanguage;
        let effectiveLevel = level;
        let effectiveUnitNumber = parseInt(unitNumber, 10) || 1;
        let effectiveUnitTitle = unitTitle;
        let effectiveUnitDescription = '';

        let parsedItems = [];

        if (Array.isArray(lessonsData)) {
            parsedItems = lessonsData;
        } else if (typeof lessonsData === 'string' || (lessonsData && typeof lessonsData === 'object')) {
            try {
                const jsonParsed = typeof lessonsData === 'string' ? JSON.parse(lessonsData) : lessonsData;
                if (Array.isArray(jsonParsed)) {
                    parsedItems = jsonParsed;
                } else if (jsonParsed && typeof jsonParsed === 'object') {
                    // Extract root-level metadata if explicitly declared in the uploaded JSON file
                    if (jsonParsed.unitNumber !== undefined && jsonParsed.unitNumber !== null && !isNaN(parseInt(jsonParsed.unitNumber, 10))) {
                        effectiveUnitNumber = parseInt(jsonParsed.unitNumber, 10);
                    }
                    if (jsonParsed.unitTitle) {
                        effectiveUnitTitle = jsonParsed.unitTitle.trim();
                    }
                    if (jsonParsed.unitDescription) {
                        effectiveUnitDescription = jsonParsed.unitDescription.trim();
                    }
                    if (jsonParsed.learningLanguage) {
                        effectiveLearningLanguage = jsonParsed.learningLanguage.trim();
                    }
                    if (jsonParsed.nativeLanguage) {
                        effectiveNativeLanguage = jsonParsed.nativeLanguage.trim();
                    }
                    if (jsonParsed.level) {
                        effectiveLevel = jsonParsed.level.trim();
                    }

                    if (Array.isArray(jsonParsed.lessons)) {
                        parsedItems = jsonParsed.lessons;
                    } else if (Array.isArray(jsonParsed.lessonsData)) {
                        parsedItems = jsonParsed.lessonsData;
                    }
                }
            } catch {
                if (typeof lessonsData === 'string') {
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
        }

        if (parsedItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid lesson data found in upload' });
        }

        // 1. Strict Malformed Challenge Schema Rejection: Check all stages before any DB write
        for (let i = 0; i < parsedItems.length; i++) {
            const item = parsedItems[i];
            if (item.stages && item.stages.length > 0) {
                const validation = validateLessonStages(item.stages);
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: `Malformed challenge schema in lesson "${item.title || i}": ${validation.errors.join('; ')}`,
                        errors: validation.errors,
                    });
                }
            }
        }

        // 2. Unit-by-Unit Bulk Upload Conflict Resolution:
        // Find existing lessons for this unit to update matches and preserve untouched lessons
        const existingLessons = await CurriculumLesson.findAll({
            where: {
                learningLanguage: effectiveLearningLanguage,
                nativeLanguage: effectiveNativeLanguage,
                level: effectiveLevel,
                unitNumber: effectiveUnitNumber,
            },
            order: [['lessonIndex', 'ASC']],
        });

        let maxIndex = existingLessons.reduce((max, l) => Math.max(max, l.lessonIndex !== undefined ? l.lessonIndex : -1), -1);

        const processedLessons = [];

        for (let i = 0; i < parsedItems.length; i++) {
            const item = parsedItems[i];
            if (!item.title) continue;

            const cleanStages = item.stages ? sanitizeLessonStages(item.stages) : [];

            // Match existing lesson by id, lessonIndex, or title (for conflict resolution)
            let existing = null;
            if (item.id) {
                existing = existingLessons.find(l => l.id === item.id);
            }
            if (!existing && item.lessonIndex !== undefined) {
                existing = existingLessons.find(l => l.lessonIndex === item.lessonIndex);
            }
            if (!existing && item.conflictResolution !== 'append' && item.title) {
                existing = existingLessons.find(l => l.title.trim().toLowerCase() === item.title.trim().toLowerCase());
            }

            if (existing) {
                // Update existing lesson: preserves original id & untouched lessons' UserNodeProgress
                existing.title = item.title.trim();
                if (item.subtitle !== undefined) existing.subtitle = item.subtitle.trim();
                if (item.nodeType !== undefined) existing.nodeType = item.nodeType;
                if (item.xpReward !== undefined) existing.xpReward = item.xpReward;
                if (item.pearlsReward !== undefined) existing.pearlsReward = item.pearlsReward;
                if (item.stages !== undefined) existing.stages = cleanStages;
                if (item.audioUrl !== undefined) existing.audioUrl = item.audioUrl;
                if (item.unitTitle || effectiveUnitTitle) existing.unitTitle = item.unitTitle || effectiveUnitTitle;
                if (item.unitDescription !== undefined || effectiveUnitDescription) existing.unitDescription = item.unitDescription !== undefined ? item.unitDescription : effectiveUnitDescription;
                if (item.isLive !== undefined) existing.isLive = Boolean(item.isLive);
                await existing.save();
                processedLessons.push(existing);
            } else {
                // Insert new lesson maintaining course hierarchy integrity
                maxIndex++;
                const newLessonIndex = (item.lessonIndex !== undefined && !existingLessons.some(l => l.lessonIndex === item.lessonIndex))
                    ? item.lessonIndex
                    : maxIndex;

                const lesson = await CurriculumLesson.create({
                    owner: req.user.id,
                    learningLanguage: item.learningLanguage || effectiveLearningLanguage,
                    nativeLanguage: item.nativeLanguage || effectiveNativeLanguage,
                    level: item.level || effectiveLevel,
                    unitNumber: item.unitNumber || effectiveUnitNumber,
                    unitTitle: item.unitTitle || effectiveUnitTitle,
                    unitDescription: item.unitDescription || effectiveUnitDescription,
                    lessonIndex: newLessonIndex,
                    title: item.title.trim(),
                    subtitle: (item.subtitle || '').trim(),
                    nodeType: item.nodeType || 'lesson',
                    xpReward: item.xpReward || 15,
                    pearlsReward: item.pearlsReward || 5,
                    isLive: item.isLive !== undefined ? Boolean(item.isLive) : false,
                    stages: cleanStages,
                    audioUrl: item.audioUrl || null,
                });
                processedLessons.push(lesson);
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk uploaded ${processedLessons.length} lessons in unit ${effectiveUnitNumber}`,
            count: processedLessons.length,
            unitNumber: effectiveUnitNumber,
            unitTitle: effectiveUnitTitle,
            lessons: processedLessons,
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

        // Slipstream Optimization: Project only lightweight metadata attributes.
        // Omit heavy `stages` and `karaokeData` JSON arrays (~525ms -> ~45ms)
        const lessons = await CurriculumLesson.findAll({
            where: { learningLanguage, nativeLanguage, level },
            attributes: [
                'id',
                'unitNumber',
                'unitTitle',
                'unitDescription',
                'lessonIndex',
                'title',
                'subtitle',
                'nodeType',
                'isLive',
                'xpReward',
                'pearlsReward',
            ],
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
            ],
        });

        // Group by unitNumber
        const unitsMap = {};
        lessons.forEach(l => {
            if (!unitsMap[l.unitNumber]) {
                const uNum = l.unitNumber || 1;
                const secNum = uNum <= 35 ? 1 : (uNum <= 70 ? 2 : 3);
                const secTitle = secNum === 1 ? 'Rookie' : (secNum === 2 ? 'Explorer' : 'Traveler');
                const secUnitNum = secNum === 1 ? uNum : (secNum === 2 ? uNum - 35 : uNum - 70);

                unitsMap[l.unitNumber] = {
                    unitNumber: l.unitNumber,
                    unitTitle: l.unitTitle || `Unit ${l.unitNumber}`,
                    unitDescription: l.unitDescription || '',
                    sectionNumber: secNum,
                    sectionTitle: secTitle,
                    sectionUnitNumber: secUnitNum,
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

// 10. Toggle all lessons in a unit live or draft
exports.toggleUnitLiveStatus = async (req, res, next) => {
    try {
        const { unitNumber } = req.params;
        const { isLive, learningLanguage = 'de', level = 'A1', nativeLanguage } = req.body;
        const resolvedNativeLanguage = nativeLanguage || req.query?.nativeLanguage;

        const where = {
            unitNumber: parseInt(unitNumber, 10),
            learningLanguage,
            level,
        };
        if (resolvedNativeLanguage) {
            where.nativeLanguage = resolvedNativeLanguage;
        }

        await CurriculumLesson.update(
            { isLive: Boolean(isLive) },
            { where }
        );

        res.json({
            success: true,
            message: `All lessons in Unit ${unitNumber} updated to ${isLive ? 'LIVE 🟢' : 'DRAFT 🔒'}`,
        });
    } catch (error) {
        next(error);
    }
};

// 11. Delete all lessons in a unit
exports.deleteUnit = async (req, res, next) => {
    try {
        const { unitNumber } = req.params;
        const { learningLanguage = 'de', level = 'A1', nativeLanguage } = req.query;
        const resolvedNativeLanguage = nativeLanguage || req.body?.nativeLanguage;

        const where = {
            unitNumber: parseInt(unitNumber, 10),
            learningLanguage,
            level,
        };
        if (resolvedNativeLanguage) {
            where.nativeLanguage = resolvedNativeLanguage;
        }

        const count = await CurriculumLesson.destroy({ where });

        res.json({
            success: true,
            message: `Deleted ${count} lessons from Unit ${unitNumber}`,
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

// 11. Trigger or verify English A1 Curriculum (Hindi & Marathi) seeding
exports.seedEnglish = async (req, res, next) => {
    try {
        const { seedEnglishCurriculumIfMissing } = require('../utils/curriculumSeeder');
        await seedEnglishCurriculumIfMissing(CurriculumLesson);
        const countHindi = await CurriculumLesson.count({ where: { learningLanguage: 'en', nativeLanguage: 'hi', level: 'A1' } });
        const countMarathi = await CurriculumLesson.count({ where: { learningLanguage: 'en', nativeLanguage: 'mr', level: 'A1' } });
        res.json({
            success: true,
            message: 'English A1 curriculum status checked and seeded',
            counts: {
                english_hindi_a1: countHindi,
                english_marathi_a1: countMarathi,
            },
        });
    } catch (error) {
        next(error);
    }
};

// 12. Upload and optimize curriculum picture to WebP (400x400, 80% quality)
exports.uploadCurriculumImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please provide an image file' });
        }

        const uploadDir = path.join(__dirname, '../uploads/curriculum');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const outputFilename = `curr-${uniqueSuffix}.webp`;
        const outputPath = path.join(uploadDir, outputFilename);

        const originalSize = req.file.buffer ? req.file.buffer.length : 0;
        if (!req.file.buffer) {
            return res.status(400).json({ success: false, message: 'Image data missing in upload' });
        }

        // Auto-orient, resize to 400x400 max, convert to WebP at 80% quality
        const info = await sharp(req.file.buffer)
            .rotate()
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const compressedSize = info.size;
        const savingsPct = originalSize > 0 
            ? Math.round(((originalSize - compressedSize) / originalSize) * 100) 
            : 0;

        const publicUrl = `/uploads/curriculum/${outputFilename}`;

        res.status(200).json({
            success: true,
            url: publicUrl,
            format: 'webp',
            width: info.width,
            height: info.height,
            originalSizeBytes: originalSize,
            compressedSizeBytes: compressedSize,
            savingsPct,
            message: `Optimized to WebP (${Math.round(compressedSize / 1024)} KB, ${savingsPct}% saved)`,
        });
    } catch (error) {
        next(error);
    }
};
