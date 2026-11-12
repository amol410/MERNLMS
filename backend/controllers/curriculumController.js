const CurriculumLesson = require('../models/CurriculumLesson');
const Note = require('../models/Note');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { sanitizeLessonStages, validateLessonStages } = require('../utils/stageSanitizer');

// Helper to determine if user has trainer or admin role
const isStaff = (user) => user && (user.role === 'trainer' || user.role === 'admin');

const SECTION_TITLES = {
    1: 'Rookie',
    2: 'Explorer',
    3: 'Traveler',
};

function getSectionTitle(secNum, customTitle) {
    if (customTitle && String(customTitle).trim()) {
        const trimmed = String(customTitle).trim();
        if (SECTION_TITLES[secNum] && trimmed === 'Rookie' && secNum !== 1) {
            return SECTION_TITLES[secNum];
        }
        return trimmed;
    }
    return SECTION_TITLES[secNum] || 'Rookie';
}

function normalizeSectionAndUnit(rawSectionNumber, rawUnitNumber) {
    let secNum = rawSectionNumber !== undefined && rawSectionNumber !== null && rawSectionNumber !== '' && !isNaN(parseInt(rawSectionNumber, 10))
        ? parseInt(rawSectionNumber, 10)
        : 1;
    let uNum = rawUnitNumber !== undefined && rawUnitNumber !== null && rawUnitNumber !== '' && !isNaN(parseInt(rawUnitNumber, 10))
        ? parseInt(rawUnitNumber, 10)
        : 1;

    // Normalize legacy 36-70 / 71-105 unit numbers into Section 2 / 3 with 1-based unit numbers
    if (uNum >= 36 && uNum <= 70) {
        if (secNum === 1 || secNum === 2) {
            secNum = 2;
            uNum = uNum - 35;
        }
    } else if (uNum >= 71) {
        if (secNum === 1 || secNum === 3) {
            secNum = 3;
            uNum = uNum - 70;
        }
    }

    return { sectionNumber: secNum, unitNumber: uNum };
}

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

        if (sectionNumber !== undefined && sectionNumber !== '') {
            where.sectionNumber = parseInt(sectionNumber, 10) || 1;
        }
        if (unitNumber !== undefined && unitNumber !== '') {
            const parsedUnit = parseInt(unitNumber, 10);
            if ((sectionNumber === undefined || sectionNumber === '') && parsedUnit >= 36) {
                const norm = normalizeSectionAndUnit(1, parsedUnit);
                where.sectionNumber = norm.sectionNumber;
                where.unitNumber = norm.unitNumber;
            } else {
                where.unitNumber = parsedUnit;
            }
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
                ['sectionNumber', 'ASC'],
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
            sectionNumber = 1,
            sectionTitle,
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

        const norm = normalizeSectionAndUnit(sectionNumber, unitNumber);
        const resolvedSectionNumber = norm.sectionNumber;
        const resolvedUnitNumber = norm.unitNumber;
        const resolvedSectionTitle = getSectionTitle(resolvedSectionNumber, sectionTitle);

        // Determine next lessonIndex if not provided
        let targetIndex = lessonIndex;
        if (targetIndex === undefined || targetIndex === null) {
            const maxLesson = await CurriculumLesson.findOne({
                where: {
                    learningLanguage,
                    nativeLanguage,
                    level,
                    sectionNumber: resolvedSectionNumber,
                    unitNumber: resolvedUnitNumber,
                },
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
            sectionNumber: resolvedSectionNumber,
            sectionTitle: resolvedSectionTitle,
            unitNumber: resolvedUnitNumber,
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
            'learningLanguage', 'nativeLanguage', 'level', 'sectionNumber', 'sectionTitle', 'unitNumber',
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

        if (req.body.sectionNumber !== undefined && req.body.sectionTitle === undefined) {
            lesson.sectionTitle = getSectionTitle(parseInt(req.body.sectionNumber, 10) || 1);
        }

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
            sectionNumber = 1,
            sectionTitle,
            unitNumber = 1,
            unitTitle = 'Coral Reef',
            unitDescription = 'Introductions & Daily Greetings',
            headings = [], // Array of { title, nodeType, subtitle, xpReward } or strings
        } = req.body;

        if (!Array.isArray(headings) || headings.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide at least one lesson heading' });
        }

        const norm = normalizeSectionAndUnit(sectionNumber, unitNumber);
        const resolvedSectionNumber = norm.sectionNumber;
        const resolvedUnitNumber = norm.unitNumber;
        const resolvedSectionTitle = getSectionTitle(resolvedSectionNumber, sectionTitle);

        // Find existing max index in this unit
        const maxLesson = await CurriculumLesson.findOne({
            where: {
                learningLanguage,
                nativeLanguage,
                level,
                sectionNumber: resolvedSectionNumber,
                unitNumber: resolvedUnitNumber,
            },
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
                sectionNumber: resolvedSectionNumber,
                sectionTitle: resolvedSectionTitle,
                unitNumber: resolvedUnitNumber,
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
            sectionNumber = 1,
            sectionTitle,
            unitNumber = 1,
            unitTitle = 'Coral Reef',
            lessonsData, // Can be array of objects, JSON string, or CSV text
            replace = false,
            conflictResolution,
        } = req.body;

        let effectiveLearningLanguage = learningLanguage;
        let effectiveNativeLanguage = nativeLanguage;
        let effectiveLevel = level;
        let effectiveSectionNumber = parseInt(sectionNumber, 10) || 1;
        let effectiveSectionTitle = getSectionTitle(effectiveSectionNumber, sectionTitle);
        let effectiveUnitNumber = parseInt(unitNumber, 10) || 1;
        let effectiveUnitTitle = unitTitle;
        let effectiveUnitDescription = '';
        let isReplaceMode = Boolean(replace === true || replace === 'true');

        let parsedItems = [];

        if (Array.isArray(lessonsData)) {
            parsedItems = lessonsData;
        } else if (typeof lessonsData === 'string' || (lessonsData && typeof lessonsData === 'object')) {
            try {
                const jsonParsed = typeof lessonsData === 'string' ? JSON.parse(lessonsData) : lessonsData;
                if (Array.isArray(jsonParsed)) {
                    parsedItems = jsonParsed;
                } else if (jsonParsed && typeof jsonParsed === 'object') {
                    if (jsonParsed.replace !== undefined) {
                        isReplaceMode = Boolean(jsonParsed.replace === true || jsonParsed.replace === 'true');
                    }
                    // Extract root-level metadata if explicitly declared in the uploaded JSON file
                    if (jsonParsed.sectionNumber !== undefined && jsonParsed.sectionNumber !== null && !isNaN(parseInt(jsonParsed.sectionNumber, 10))) {
                        effectiveSectionNumber = parseInt(jsonParsed.sectionNumber, 10);
                        effectiveSectionTitle = getSectionTitle(effectiveSectionNumber, jsonParsed.sectionTitle || sectionTitle);
                    }
                    if (jsonParsed.sectionTitle) {
                        effectiveSectionTitle = jsonParsed.sectionTitle.trim();
                    }
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
                    } else if (Array.isArray(jsonParsed.units)) {
                        parsedItems = [];
                        for (const u of jsonParsed.units) {
                            const uLessons = u.lessons || u.lessonsData || [];
                            for (const l of uLessons) {
                                parsedItems.push({
                                    ...l,
                                    sectionNumber: l.sectionNumber !== undefined
                                        ? l.sectionNumber
                                        : (u.sectionNumber !== undefined ? u.sectionNumber : jsonParsed.sectionNumber),
                                    sectionTitle: l.sectionTitle || u.sectionTitle || jsonParsed.sectionTitle,
                                    unitNumber: l.unitNumber !== undefined ? l.unitNumber : u.unitNumber,
                                    unitTitle: l.unitTitle || u.unitTitle,
                                    unitDescription: l.unitDescription || u.unitDescription,
                                    learningLanguage: l.learningLanguage || u.learningLanguage || jsonParsed.learningLanguage,
                                    nativeLanguage: l.nativeLanguage || u.nativeLanguage || jsonParsed.nativeLanguage,
                                    level: l.level || u.level || jsonParsed.level,
                                });
                            }
                        }
                    } else if (Array.isArray(jsonParsed.sections)) {
                        parsedItems = [];
                        for (const sec of jsonParsed.sections) {
                            const secUnits = sec.units || [];
                            for (const u of secUnits) {
                                const uLessons = u.lessons || u.lessonsData || [];
                                for (const l of uLessons) {
                                    parsedItems.push({
                                        ...l,
                                        sectionNumber: l.sectionNumber !== undefined
                                            ? l.sectionNumber
                                            : (u.sectionNumber !== undefined ? u.sectionNumber : sec.sectionNumber),
                                        sectionTitle: l.sectionTitle || u.sectionTitle || sec.sectionTitle,
                                        unitNumber: l.unitNumber !== undefined ? l.unitNumber : u.unitNumber,
                                        unitTitle: l.unitTitle || u.unitTitle,
                                        unitDescription: l.unitDescription || u.unitDescription,
                                        learningLanguage: l.learningLanguage || u.learningLanguage || jsonParsed.learningLanguage,
                                        nativeLanguage: l.nativeLanguage || u.nativeLanguage || jsonParsed.nativeLanguage,
                                        level: l.level || u.level || jsonParsed.level,
                                    });
                                }
                            }
                        }
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

        // Normalize effective section and unit
        const effNorm = normalizeSectionAndUnit(effectiveSectionNumber, effectiveUnitNumber);
        effectiveSectionNumber = effNorm.sectionNumber;
        effectiveUnitNumber = effNorm.unitNumber;
        effectiveSectionTitle = getSectionTitle(effectiveSectionNumber, effectiveSectionTitle);

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

        // 2. Unit-by-Unit Bulk Upload Conflict Resolution & Replace Support (scoped by sectionNumber + unitNumber):
        const resolveItemTarget = (item) => {
            const rawSec = item.sectionNumber !== undefined && item.sectionNumber !== null && !isNaN(parseInt(item.sectionNumber, 10))
                ? parseInt(item.sectionNumber, 10)
                : effectiveSectionNumber;
            const rawUnit = item.unitNumber !== undefined && item.unitNumber !== null && !isNaN(parseInt(item.unitNumber, 10))
                ? parseInt(item.unitNumber, 10)
                : effectiveUnitNumber;
            return normalizeSectionAndUnit(rawSec, rawUnit);
        };

        const targetUnitsMap = new Map();
        parsedItems.forEach(item => {
            const t = resolveItemTarget(item);
            const key = `${t.sectionNumber}_${t.unitNumber}`;
            if (!targetUnitsMap.has(key)) {
                targetUnitsMap.set(key, t);
            }
        });
        const targetUnits = Array.from(targetUnitsMap.values());
        const targetUnitNumbers = [...new Set(targetUnits.map(t => t.unitNumber))];

        // In Replace Mode: Completely discard and remove all existing lessons in target (sectionNumber, unitNumber) pair(s)
        if (isReplaceMode) {
            for (const target of targetUnits) {
                await CurriculumLesson.destroy({
                    where: {
                        learningLanguage: effectiveLearningLanguage,
                        nativeLanguage: effectiveNativeLanguage,
                        level: effectiveLevel,
                        sectionNumber: target.sectionNumber,
                        unitNumber: target.unitNumber,
                    },
                });
            }
        }

        const processedLessons = [];

        for (const target of targetUnits) {
            const secNum = target.sectionNumber;
            const uNum = target.unitNumber;

            const unitItems = parsedItems.filter(item => {
                const t = resolveItemTarget(item);
                return t.sectionNumber === secNum && t.unitNumber === uNum;
            });

            let existingLessons = [];
            let maxIndex = -1;

            if (!isReplaceMode) {
                existingLessons = await CurriculumLesson.findAll({
                    where: {
                        learningLanguage: effectiveLearningLanguage,
                        nativeLanguage: effectiveNativeLanguage,
                        level: effectiveLevel,
                        sectionNumber: secNum,
                        unitNumber: uNum,
                    },
                    order: [['lessonIndex', 'ASC']],
                });
                maxIndex = existingLessons.reduce((max, l) => Math.max(max, l.lessonIndex !== undefined ? l.lessonIndex : -1), -1);
            }

            for (let i = 0; i < unitItems.length; i++) {
                const item = unitItems[i];
                if (!item.title) continue;

                const cleanStages = item.stages ? sanitizeLessonStages(item.stages) : [];
                const itemSectionTitle = getSectionTitle(secNum, item.sectionTitle || effectiveSectionTitle);

                // Match existing lesson:
                // Only match if NOT in replace mode AND:
                // 1) Explicit primary key id match, OR
                // 2) Explicit conflictResolution === 'update' by title
                let existing = null;
                if (!isReplaceMode) {
                    if (item.id) {
                        existing = existingLessons.find(l => String(l.id) === String(item.id));
                    }
                    const shouldUpdateByTitle = (req.body.conflictResolution === 'update' || item.conflictResolution === 'update');
                    if (!existing && shouldUpdateByTitle && item.title) {
                        existing = existingLessons.find(l => l.title.trim().toLowerCase() === item.title.trim().toLowerCase());
                    }
                }

                if (existing) {
                    // Update existing lesson: preserves original id & untouched lessons' UserNodeProgress
                    existing.title = item.title.trim();
                    existing.sectionNumber = secNum;
                    existing.sectionTitle = itemSectionTitle;
                    if (item.subtitle !== undefined) existing.subtitle = item.subtitle.trim();
                    if (item.nodeType !== undefined) existing.nodeType = item.nodeType;
                    if (item.xpReward !== undefined) existing.xpReward = item.xpReward;
                    if (item.pearlsReward !== undefined) existing.pearlsReward = item.pearlsReward;
                    if (item.stages !== undefined) existing.stages = cleanStages;
                    if (item.audioUrl !== undefined) existing.audioUrl = item.audioUrl;
                    if (item.unitTitle || effectiveUnitTitle) existing.unitTitle = item.unitTitle || effectiveUnitTitle;
                    if (item.unitDescription !== undefined || effectiveUnitDescription) {
                        existing.unitDescription = item.unitDescription !== undefined ? item.unitDescription : effectiveUnitDescription;
                    }
                    if (item.isLive !== undefined) existing.isLive = Boolean(item.isLive);
                    await existing.save();
                    processedLessons.push(existing);
                } else {
                    // Determine lessonIndex for newly inserted lesson:
                    let newLessonIndex;
                    if (isReplaceMode) {
                        // In replace mode: lessons start fresh; respect declared lessonIndex or sequential 0..N
                        if (item.lessonIndex !== undefined && !isNaN(parseInt(item.lessonIndex, 10))) {
                            newLessonIndex = parseInt(item.lessonIndex, 10);
                        } else {
                            maxIndex++;
                            newLessonIndex = maxIndex;
                        }
                    } else {
                        // In append mode:
                        // If there are existing lessons in this unit, new lessons MUST go strictly below existing lessons!
                        if (existingLessons.length > 0) {
                            maxIndex++;
                            newLessonIndex = maxIndex;
                        } else {
                            // First time uploading to an empty unit: respect declared index or sequential 0..N
                            maxIndex++;
                            newLessonIndex = (item.lessonIndex !== undefined && !isNaN(parseInt(item.lessonIndex, 10)))
                                ? parseInt(item.lessonIndex, 10)
                                : maxIndex;
                            maxIndex = Math.max(maxIndex, newLessonIndex);
                        }
                    }

                    const lesson = await CurriculumLesson.create({
                        owner: req.user.id,
                        learningLanguage: item.learningLanguage || effectiveLearningLanguage,
                        nativeLanguage: item.nativeLanguage || effectiveNativeLanguage,
                        level: item.level || effectiveLevel,
                        sectionNumber: secNum,
                        sectionTitle: itemSectionTitle,
                        unitNumber: uNum,
                        unitTitle: item.unitTitle || effectiveUnitTitle,
                        unitDescription: item.unitDescription !== undefined ? item.unitDescription : effectiveUnitDescription,
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
        }

        res.status(201).json({
            success: true,
            message: isReplaceMode
                ? `Replaced Section ${effectiveSectionNumber} • Unit ${targetUnitNumbers.join(', ')} with ${processedLessons.length} lessons`
                : `Bulk uploaded ${processedLessons.length} lessons in Section ${effectiveSectionNumber} • Unit ${effectiveUnitNumber}`,
            count: processedLessons.length,
            sectionNumber: effectiveSectionNumber,
            sectionTitle: effectiveSectionTitle,
            unitNumber: effectiveUnitNumber,
            unitTitle: effectiveUnitTitle,
            lessons: processedLessons,
            replaced: isReplaceMode,
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
                'sectionNumber',
                'sectionTitle',
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
                ['sectionNumber', 'ASC'],
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
            ],
        });

        // Group by (sectionNumber, unitNumber)
        const unitsMap = {};
        lessons.forEach(l => {
            const rawUnit = l.unitNumber || 1;
            const rawSec = l.sectionNumber || 1;
            const norm = normalizeSectionAndUnit(rawSec, rawUnit);
            const secNum = norm.sectionNumber;
            const secUnitNum = norm.unitNumber;
            const secTitle = getSectionTitle(secNum, l.sectionTitle);
            const key = `${secNum}_${secUnitNum}`;

            if (!unitsMap[key]) {
                unitsMap[key] = {
                    unitNumber: secUnitNum,
                    unitTitle: l.unitTitle || `Unit ${secUnitNum}`,
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
            unitsMap[key].totalLessons++;
            if (l.isLive) {
                unitsMap[key].liveLessons++;
            } else {
                unitsMap[key].draftLessons++;
            }
            unitsMap[key].lessons.push(l);
        });

        const units = Object.values(unitsMap).sort((a, b) => {
            if (a.sectionNumber !== b.sectionNumber) return a.sectionNumber - b.sectionNumber;
            return a.unitNumber - b.unitNumber;
        });

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
        const { isLive, learningLanguage = 'de', level = 'A1', nativeLanguage, sectionNumber } = req.body;
        const resolvedNativeLanguage = nativeLanguage || req.query?.nativeLanguage;
        const resolvedSectionNumber = sectionNumber !== undefined ? sectionNumber : req.query?.sectionNumber;

        const where = {
            unitNumber: parseInt(unitNumber, 10),
            learningLanguage,
            level,
        };
        if (resolvedNativeLanguage) {
            where.nativeLanguage = resolvedNativeLanguage;
        }
        if (resolvedSectionNumber !== undefined && resolvedSectionNumber !== '') {
            where.sectionNumber = parseInt(resolvedSectionNumber, 10);
        }

        await CurriculumLesson.update(
            { isLive: Boolean(isLive) },
            { where }
        );

        res.json({
            success: true,
            message: `All lessons in ${resolvedSectionNumber ? `Section ${resolvedSectionNumber} • ` : ''}Unit ${unitNumber} updated to ${isLive ? 'LIVE 🟢' : 'DRAFT 🔒'}`,
        });
    } catch (error) {
        next(error);
    }
};

// 11. Delete all lessons in a unit
exports.deleteUnit = async (req, res, next) => {
    try {
        const { unitNumber } = req.params;
        const { learningLanguage = 'de', level = 'A1', nativeLanguage, sectionNumber } = req.query;
        const resolvedNativeLanguage = nativeLanguage || req.body?.nativeLanguage;
        const resolvedSectionNumber = sectionNumber !== undefined ? sectionNumber : req.body?.sectionNumber;

        const where = {
            unitNumber: parseInt(unitNumber, 10),
            learningLanguage,
            level,
        };
        if (resolvedNativeLanguage) {
            where.nativeLanguage = resolvedNativeLanguage;
        }
        if (resolvedSectionNumber !== undefined && resolvedSectionNumber !== '') {
            where.sectionNumber = parseInt(resolvedSectionNumber, 10);
        }

        const count = await CurriculumLesson.destroy({ where });

        res.json({
            success: true,
            message: `Deleted ${count} lessons from ${resolvedSectionNumber ? `Section ${resolvedSectionNumber} • ` : ''}Unit ${unitNumber}`,
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
