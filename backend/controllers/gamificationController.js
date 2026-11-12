const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const UserNodeProgress = require('../models/UserNodeProgress');
const UserQuest = require('../models/UserQuest');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const CurriculumLesson = require('../models/CurriculumLesson');
const RewardTransaction = require('../models/RewardTransaction');
const UserActivity = require('../models/UserActivity');
const { getTodayLocalYMD, getClientDate } = require('../utils/dateHelper');
const { sanitizeLessonStages } = require('../utils/stageSanitizer');
const { verifyAdMobQuery } = require('../utils/adMobVerifier');

const PLACEMENT_MIN_SCORE_PCT = 70;
const PLACEMENT_MAX_MISTAKES = 3;
const PLACEMENT_EXCLUDED_STAGE_TYPES = new Set(['sprechen', 'karaoke']);

function parseUnlockedLevels(raw) {
    const levels = new Set(['A1']);
    if (Array.isArray(raw)) {
        raw.forEach(l => { if (typeof l === 'string' && l.trim()) levels.add(l.trim().toUpperCase()); });
    } else if (typeof raw === 'string' && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                parsed.forEach(l => { if (typeof l === 'string' && l.trim()) levels.add(l.trim().toUpperCase()); });
            }
        } catch (_) {}
    }
    return Array.from(levels);
}

function parsePlacementSkipMap(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
    if (typeof raw === 'string' && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (_) {}
    }
    return {};
}

function getEffectiveSkipNodeForCourse(user, courseId) {
    if (!user) return 0;
    const normalizedCourseId = (courseId || '').toLowerCase();
    const skipMap = parsePlacementSkipMap(user.placementSkipMap);
    if (Number.isInteger(skipMap[normalizedCourseId]) && skipMap[normalizedCourseId] > 0) {
        return skipMap[normalizedCourseId];
    }
    const userDefaultCourseId = `${user.targetLanguage || 'de'}_${user.nativeLanguage || (user.targetLanguage === 'en' ? 'mr' : 'en')}_${user.currentLevel || 'A1'}`.toLowerCase();
    if (normalizedCourseId === userDefaultCourseId && Number.isInteger(user.placementSkipToNode) && user.placementSkipToNode > 0) {
        return user.placementSkipToNode;
    }
    return 0;
}

function applyDailyStreakUpdate(user, todayYMD) {
    if (!user.lastActiveDate) {
        user.streakCount = 1;
        user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
        user.lastActiveDate = todayYMD;
    } else {
        const lastDate = new Date(user.lastActiveDate);
        const todayDate = new Date(todayYMD);
        const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            user.streakCount = (user.streakCount || 0) + 1;
            user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
            user.lastActiveDate = todayYMD;
        } else if (diffDays > 1) {
            if ((user.streakFreezeCount || 0) > 0) {
                user.streakFreezeCount = Math.max(0, (user.streakFreezeCount || 0) - 1);
                user.lastActiveDate = todayYMD;
            } else {
                user.streakCount = 1;
                user.streakFreezeCount = 0;
                user.lastActiveDate = todayYMD;
            }
        } else {
            user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
        }
    }
    user.longestStreak = Math.max(user.longestStreak || 1, user.streakCount || 1);
}

// 1. Get current user gamification economy status (with oxygen auto-refill)
exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Auto-refill 1 oxygen every 30 minutes if under 5
        if (user.oxygen < 5 && user.lastOxygenRefill) {
            const now = new Date();
            const elapsedMs = now - new Date(user.lastOxygenRefill);
            const refillIntervalMs = 30 * 60 * 1000;
            const unitsToAdd = Math.floor(elapsedMs / refillIntervalMs);

            if (unitsToAdd > 0) {
                user.oxygen = Math.min(5, user.oxygen + unitsToAdd);
                user.lastOxygenRefill = new Date(new Date(user.lastOxygenRefill).getTime() + (unitsToAdd * refillIntervalMs));
                await user.save();
            }
        }

        const targetLang = user.targetLanguage || 'de';
        const nativeLang = user.nativeLanguage || (targetLang === 'en' ? 'mr' : 'en');
        const currentLevel = user.currentLevel || 'A1';
        const activeCourseId = `${targetLang}_${nativeLang}_${currentLevel}`.toLowerCase();
        const effectiveSkipToNode = getEffectiveSkipNodeForCourse(user, activeCourseId);
        const unlockedLevels = parseUnlockedLevels(user.unlockedLevels);
        const isAcceleratedFallback = !!(effectiveSkipToNode > 0 && user.placementLevel && user.placementLevel !== currentLevel);

        const isDoubleXpActive = !!(user.doubleXpExpiresAt && new Date(user.doubleXpExpiresAt) > new Date());
        res.status(200).json({
            success: true,
            oxygen: user.oxygen ?? 5,
            pearls: user.pearls ?? 100,
            status: {
                streakCount: user.streakCount || 1,
                longestStreak: user.longestStreak || 1,
                lastActiveDate: user.lastActiveDate,
                dailyTargetXp: user.dailyTargetXp || 20,
                targetLanguage: targetLang,
                nativeLanguage: nativeLang,
                currentLevel,
                pearls: user.pearls ?? 100,
                oxygen: user.oxygen ?? 5,
                totalXp: user.totalXp || 0,
                currentLeague: user.currentLeague || 'Coral Reef',
                streakFreezeCount: user.streakFreezeCount || 0,
                isDoubleXpActive,
                doubleXpExpiresAt: user.doubleXpExpiresAt,
                placementCompleted: !!user.placementCompleted,
                placementLevel: user.placementLevel || null,
                placementSkipToNode: effectiveSkipToNode,
                unlockedLevels,
                isAcceleratedFallback,
            }
        });
    } catch (error) {
        next(error);
    }
};

function getDefaultNodesForCourse(targetLang, sampleNoteId, sampleQuizId) {
    if (targetLang === 'de') {
        return [
            {
                index: 0,
                title: 'Grundlagen & Begrüßung',
                subtitle: 'Wichtige deutsche Begrüßungen & Etikette',
                type: 'lesson',
                xpReward: 15,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: 0.0,
            },
            {
                index: 1,
                title: 'Audio-Karaoke Rhythmus',
                subtitle: 'Wort-für-Wort synchronisiertes Hören',
                type: 'karaoke',
                xpReward: 20,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: 45.0,
            },
            {
                index: 2,
                title: 'Sprechen & Aussprache',
                subtitle: 'Sprachaufnahme & Aussprache-Training',
                type: 'speech',
                xpReward: 25,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: -40.0,
            },
            {
                index: 3,
                title: 'Versunkene Schatztruhe',
                subtitle: 'Bonus 30 Perlen & 20 XP',
                type: 'chest',
                xpReward: 20,
                pearlsReward: 30,
                offset: 20.0,
            },
            {
                index: 4,
                title: 'Wortpaare finden',
                subtitle: 'Schnelles Wortschatz-Zuordnungsspiel',
                type: 'match',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: -45.0,
            },
            {
                index: 5,
                title: 'Satzbaumeister',
                subtitle: 'Grammatik-Struktur-Rätsel',
                type: 'builder',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: 35.0,
            },
            {
                index: 6,
                title: 'Korallenriff-Prüfung',
                subtitle: 'Abschluss-Meisterprüfung für das Riff',
                type: 'boss',
                xpReward: 35,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: 0.0,
            },
        ];
    } else {
        // English course fallback nodes
        return [
            {
                index: 0,
                title: 'Basics & Greetings',
                subtitle: 'Essential English greetings & daily dialogue',
                type: 'lesson',
                xpReward: 15,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: 0.0,
            },
            {
                index: 1,
                title: 'Audio Karaoke Rhythm',
                subtitle: 'Word-by-word synced listening practice',
                type: 'karaoke',
                xpReward: 20,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: 45.0,
            },
            {
                index: 2,
                title: 'Speak Aloud Practice',
                subtitle: 'Voice dictation & pronunciation training',
                type: 'speech',
                xpReward: 25,
                sourceType: 'note',
                sourceId: sampleNoteId,
                offset: -40.0,
            },
            {
                index: 3,
                title: 'Sunken Treasure Chest',
                subtitle: 'Bonus 30 Pearls & 20 XP',
                type: 'chest',
                xpReward: 20,
                pearlsReward: 30,
                offset: 20.0,
            },
            {
                index: 4,
                title: 'Match the Pairs',
                subtitle: 'Rapid vocabulary matching drill',
                type: 'match',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: -45.0,
            },
            {
                index: 5,
                title: 'Sentence Architect',
                subtitle: 'Grammar structure puzzle drill',
                type: 'builder',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: 35.0,
            },
            {
                index: 6,
                title: 'Coral Reef Exam',
                subtitle: 'Milestone mastery test to promote',
                type: 'boss',
                xpReward: 35,
                sourceType: 'quiz',
                sourceId: sampleQuizId,
                offset: 0.0,
            },
        ];
    }
}

// 2. Get Archipelago Map Nodes with User Progression
exports.getPath = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Determine learning language, native instruction language, and CEFR level
        const userRecord = await User.findByPk(userId);
        const targetLang = req.query.learningLanguage || req.query.targetLanguage || userRecord?.targetLanguage || req.user.targetLanguage || 'de';
        let nativeLang = req.query.nativeLanguage || userRecord?.nativeLanguage || req.user.nativeLanguage;
        if (!nativeLang) {
            nativeLang = (targetLang === 'en') ? 'mr' : 'en';
        }
        const level = req.query.level || userRecord?.currentLevel || req.user.currentLevel || 'A1';
        const courseId = `${targetLang}_${nativeLang}_${level}`.toLowerCase();
        const skipToNode = getEffectiveSkipNodeForCourse(userRecord || req.user, courseId);

        // Query user progress strictly scoped to this course
        const progressList = await UserNodeProgress.findAll({
            where: {
                userId,
                courseId,
            },
        });
        const progressMap = {};
        let highestCompletedIndex = -1;
        progressList.forEach(p => {
            progressMap[p.nodeIndex] = p;
            if (p.status === 'completed' && p.nodeIndex > highestCompletedIndex) {
                highestCompletedIndex = p.nodeIndex;
            }
        });

        // Section & Unit pagination support (with windowing lookahead)
        const whereClause = {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level: level,
        };

        const section = req.query.section ? parseInt(req.query.section, 10) : null;
        const unit = req.query.unit ? parseInt(req.query.unit, 10) : null;
        const startUnit = req.query.startUnit ? parseInt(req.query.startUnit, 10) : null;
        const endUnit = req.query.endUnit ? parseInt(req.query.endUnit, 10) : null;

        // Query all live lesson IDs for this course to preserve global node.index under windowing
        const allCourseLessons = await CurriculumLesson.findAll({
            where: {
                isLive: true,
                learningLanguage: targetLang,
                nativeLanguage: nativeLang,
                level: level,
            },
            attributes: ['id', 'sectionNumber', 'unitNumber'],
            order: [
                ['sectionNumber', 'ASC'],
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
            raw: true,
        });
        const globalIndexMap = new Map();
        const unitOrdinalMap = new Map();
        let unitCounter = 0;
        if (Array.isArray(allCourseLessons)) {
            allCourseLessons.forEach((lesson, idx) => {
                if (lesson && lesson.id !== undefined) {
                    globalIndexMap.set(lesson.id, idx);
                    const secKey = `${lesson.sectionNumber || 1}_${lesson.unitNumber || 1}`;
                    if (!unitOrdinalMap.has(secKey)) {
                        unitCounter++;
                        unitOrdinalMap.set(secKey, unitCounter);
                    }
                }
            });
        }

        if (startUnit && endUnit) {
            if (section) {
                whereClause.sectionNumber = section;
                whereClause.unitNumber = { [Op.between]: [startUnit, endUnit] };
            } else if (Array.isArray(allCourseLessons) && allCourseLessons.length > 0) {
                const matchingIds = allCourseLessons
                    .filter(l => {
                        const secKey = `${l.sectionNumber || 1}_${l.unitNumber || 1}`;
                        const seqUnit = unitOrdinalMap.get(secKey) || 1;
                        return seqUnit >= startUnit && seqUnit <= endUnit;
                    })
                    .map(l => l.id);
                whereClause.id = { [Op.in]: matchingIds };
            } else {
                whereClause.unitNumber = { [Op.between]: [startUnit, endUnit] };
            }
        } else if (unit) {
            if (section) {
                whereClause.sectionNumber = section;
            }
            whereClause.unitNumber = unit;
        } else if (section) {
            if (section === 1) {
                whereClause.sectionNumber = 1;
                whereClause.unitNumber = { [Op.lte]: 35 };
            } else {
                const secStartUnit = (section - 1) * 35 + 1;
                const secEndUnit = section * 35;
                whereClause[Op.or] = [
                    { sectionNumber: section },
                    { sectionNumber: 1, unitNumber: { [Op.between]: [secStartUnit, secEndUnit] } },
                ];
            }
        }

        // Fetch live published lessons created by admin/trainers for this language/level
        // CRITICAL PERFORMANCE: Only select map navigation attributes. Omit heavy `stages` & `karaokeData`!
        const liveCurriculum = await CurriculumLesson.findAll({
            where: whereClause,
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
                'xpReward',
                'pearlsReward',
                'audioUrl',
                'sourceNoteId',
                'updatedAt',
            ],
            order: [
                ['sectionNumber', 'ASC'],
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        const zigzagOffsets = [0.0, 45.0, -40.0, 20.0, -45.0, 35.0, 0.0, -35.0, 40.0];

        const unitColors = ['#1CB0F6', '#58CC02', '#FF9600', '#CE82FF', '#FF4B4B', '#00CD9C', '#FFC800'];

        let targetNodesList = [];
        if (liveCurriculum && liveCurriculum.length > 0) {
            targetNodesList = liveCurriculum.map((l, idx) => {
                const globalIdx = globalIndexMap.has(l.id) ? globalIndexMap.get(l.id) : idx;
                const rawUnit = l.unitNumber || 1;
                const rawSec = l.sectionNumber || 1;
                const isLegacyHighUnit = rawSec === 1 && rawUnit > 35;
                const secNum = isLegacyHighUnit ? (rawUnit <= 70 ? 2 : 3) : rawSec;
                const defaultSecTitle = secNum === 1 ? 'Rookie' : (secNum === 2 ? 'Explorer' : 'Traveler');
                const secTitle = (l.sectionTitle && !(l.sectionTitle === 'Rookie' && secNum !== 1))
                    ? l.sectionTitle
                    : defaultSecTitle;
                const secUnitNum = isLegacyHighUnit
                    ? (secNum === 2 ? rawUnit - 35 : rawUnit - 70)
                    : rawUnit;
                const colorIdx = (secNum - 1) * 12 + (secUnitNum - 1);
                const colorHex = unitColors[Math.abs(colorIdx) % unitColors.length];

                return {
                    id: l.id,
                    index: globalIdx,
                    unitNumber: rawUnit,
                    unitTitle: l.unitTitle || 'First Steps',
                    unitDescription: l.unitDescription || '',
                    sectionNumber: secNum,
                    sectionTitle: secTitle,
                    sectionUnitNumber: secUnitNum,
                    colorHex: colorHex,
                    title: l.title,
                    subtitle: l.subtitle || '',
                    type: l.nodeType || 'lesson',
                    xpReward: l.xpReward || 15,
                    pearlsReward: l.pearlsReward || (l.nodeType === 'chest' ? 30 : 5),
                    sourceType: l.nodeType === 'karaoke' ? 'note' : 'lesson',
                    sourceId: l.sourceNoteId || l.id,
                    stages: null, // Stages loaded on demand via /api/gamification/lesson/:id
                    audioUrl: l.audioUrl,
                    offset: zigzagOffsets[globalIdx % zigzagOffsets.length],
                    updatedAt: l.updatedAt ? (typeof l.updatedAt.toISOString === 'function' ? l.updatedAt.toISOString() : String(l.updatedAt)) : null,
                };
            });
        } else {
            // Slipstream Optimization: Ghost queries pruned!
            // Only query sampleNote & sampleQuiz if no live curriculum lessons are present.
            const sampleNote = await Note.findOne({
                where: { contentType: 'karaoke' },
                order: [['createdAt', 'DESC']],
            });
            const sampleQuiz = await Quiz.findOne({
                order: [['createdAt', 'DESC']],
            });
            targetNodesList = getDefaultNodesForCourse(
                targetLang,
                sampleNote ? sampleNote.id : null,
                sampleQuiz ? sampleQuiz.id : null
            );
        }

        // Enrich nodes with user completion status + Virtual Placement Skip Pointer (no ghost DB rows)
        const frontierIndex = Math.max(skipToNode, highestCompletedIndex + 1);
        const nodes = targetNodesList.map(node => {
            const prog = progressMap[node.index];
            let status = 'locked';
            let isFastTracked = false;

            if (prog && prog.status === 'completed') {
                status = 'completed';
            } else if (node.index < skipToNode) {
                status = 'completed';
                isFastTracked = true;
            } else if (node.index === 0 || node.index === skipToNode || node.index === frontierIndex) {
                status = (prog && prog.status === 'completed') ? 'completed' : 'available';
            } else {
                const prev = progressMap[node.index - 1];
                const prevCompleted = (prev && prev.status === 'completed') || (node.index - 1 < skipToNode);
                if (prevCompleted) {
                    status = prog ? prog.status : 'available';
                } else {
                    status = prog ? prog.status : 'locked';
                }
            }

            return {
                ...node,
                stages: null,
                status,
                isFastTracked,
                stars: prog ? prog.stars : (isFastTracked ? 3 : 0),
                scorePct: prog ? prog.scorePct : (isFastTracked ? 100 : 0),
            };
        });

        res.status(200).json({
            success: true,
            nodes,
            meta: {
                courseId,
                skipToNode,
                frontierIndex,
                placementLevel: userRecord?.placementLevel || null,
                unlockedLevels: parseUnlockedLevels(userRecord?.unlockedLevels),
            },
        });
    } catch (error) {
        next(error);
    }
};

async function resolveNodeDefinition(targetLang, nativeLang, level, nodeIndex) {
    const lessons = await CurriculumLesson.findAll({
        where: {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level,
        },
        attributes: ['id', 'nodeType', 'xpReward', 'pearlsReward'],
        order: [['sectionNumber', 'ASC'], ['unitNumber', 'ASC'], ['lessonIndex', 'ASC'], ['id', 'ASC']],
    });

    if (lessons.length > 0) {
        const lesson = lessons[nodeIndex];
        if (!lesson) return null;
        return {
            type: lesson.nodeType || 'lesson',
            xpReward: lesson.xpReward || 15,
            pearlsReward: lesson.pearlsReward || 5,
        };
    }

    return getDefaultNodesForCourse(targetLang, null, null)[nodeIndex] || null;
}

function calculateNodeReward(node, scorePct) {
    if (node.type === 'chest') {
        return {
            scorePct: 100,
            stars: 3,
            xpEarned: Math.max(0, node.xpReward || 20),
            pearlsEarned: Math.max(0, node.pearlsReward || 30),
        };
    }

    return {
        scorePct,
        stars: scorePct === 100 ? 3 : (scorePct >= 80 ? 2 : 1),
        xpEarned: 10 + (scorePct === 100 ? 2 : (scorePct >= 80 ? 1 : 0)),
        pearlsEarned: scorePct === 100 ? 1 : 0,
    };
}

// 3. Complete a node, award XP/pearls, update streak, unlock next node
exports.completeNode = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { nodeIndex, scorePct } = req.body;
        const attemptId = req.get('Idempotency-Key') || req.body.attemptId;

        if (!Number.isInteger(nodeIndex) || nodeIndex < 0) {
            return res.status(400).json({ success: false, message: 'nodeIndex must be a non-negative integer' });
        }
        if (typeof attemptId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(attemptId)) {
            return res.status(400).json({ success: false, message: 'A valid attemptId or Idempotency-Key is required' });
        }
        if (!Number.isInteger(scorePct) || scorePct < 0 || scorePct > 100) {
            return res.status(400).json({ success: false, message: 'scorePct must be an integer between 0 and 100' });
        }

        const currentUser = await User.findByPk(userId, { attributes: ['id', 'targetLanguage', 'nativeLanguage', 'currentLevel'] });
        if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

        const targetLang = req.body.learningLanguage || req.body.targetLanguage || currentUser.targetLanguage || 'de';
        const nativeLang = req.body.nativeLanguage || currentUser.nativeLanguage || (targetLang === 'en' ? 'mr' : 'en');
        const level = req.body.level || currentUser.currentLevel || 'A1';
        const courseId = `${targetLang}_${nativeLang}_${level}`.toLowerCase();
        const node = await resolveNodeDefinition(targetLang, nativeLang, level, nodeIndex);
        if (!node) return res.status(404).json({ success: false, message: 'Course node not found' });

        const reward = calculateNodeReward(node, scorePct);
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const existing = await RewardTransaction.findOne({
                where: { userId, kind: 'lesson', reference: attemptId },
                transaction,
            });
            if (existing) {
                return {
                    status: 200,
                    body: { ...existing.responseBody, idempotentReplay: true },
                };
            }

            let progress = await UserNodeProgress.findOne({
                where: { userId, courseId, nodeIndex },
                transaction,
            });
            if (!progress) {
                progress = await UserNodeProgress.create({
                    userId,
                    courseId,
                    nodeIndex,
                    status: 'completed',
                    stars: reward.stars,
                    scorePct: reward.scorePct,
                    completedAt: new Date(),
                }, { transaction });
            } else {
                progress.status = 'completed';
                progress.stars = Math.max(progress.stars, reward.stars);
                progress.scorePct = Math.max(progress.scorePct, reward.scorePct);
                progress.completedAt = new Date();
                await progress.save({ transaction });
            }

            const nextNodeIndex = nodeIndex + 1;
            let nextProg = await UserNodeProgress.findOne({
                where: { userId, courseId, nodeIndex: nextNodeIndex },
                transaction,
            });
            if (!nextProg) {
                await UserNodeProgress.create({
                    userId,
                    courseId,
                    nodeIndex: nextNodeIndex,
                    status: 'available',
                }, { transaction });
            } else if (nextProg.status === 'locked') {
                nextProg.status = 'available';
                await nextProg.save({ transaction });
            }

            const isDoubleXpActive = !!(user.doubleXpExpiresAt && new Date(user.doubleXpExpiresAt) > new Date());
            const finalXpEarned = isDoubleXpActive ? reward.xpEarned * 2 : reward.xpEarned;
            user.totalXp = (user.totalXp || 0) + finalXpEarned;
            user.pearls = (user.pearls || 0) + reward.pearlsEarned;

            // Server-authoritative UTC date (anti-tamper: strictly ignore client-supplied timestamps)
            const todayYMD = new Date().toISOString().split('T')[0];
            if (!user.lastActiveDate) {
                user.streakCount = 1;
                user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
                user.lastActiveDate = todayYMD;
            } else {
                const lastDate = new Date(user.lastActiveDate);
                const todayDate = new Date(todayYMD);
                const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    user.streakCount = (user.streakCount || 0) + 1;
                    user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
                    user.lastActiveDate = todayYMD;
                } else if (diffDays > 1) {
                    if ((user.streakFreezeCount || 0) > 0) {
                        user.streakFreezeCount = Math.max(0, (user.streakFreezeCount || 0) - 1);
                        user.lastActiveDate = todayYMD;
                        // Streak preserved thanks to active Streak Freeze!
                    } else {
                        user.streakCount = 1;
                        user.streakFreezeCount = 0;
                        user.lastActiveDate = todayYMD;
                    }
                } else {
                    user.streakFreezeCount = Math.max(0, user.streakFreezeCount || 0);
                }
            }

            user.longestStreak = Math.max(user.longestStreak || 1, user.streakCount);
            await user.save({ transaction });

            // Increment today's active daily quests on learning events
            try {
                const todayQuests = await UserQuest.findAll({
                    where: { userId, questDate: todayYMD, isClaimed: false },
                    transaction,
                });
                for (const q of todayQuests) {
                    if (q.questType === 'xp') {
                        q.currentAmount = Math.min(q.targetAmount, (q.currentAmount || 0) + finalXpEarned);
                        await q.save({ transaction });
                    } else if (q.questType === 'lesson' || q.questType === 'speech') {
                        q.currentAmount = Math.min(q.targetAmount, (q.currentAmount || 0) + 1);
                        await q.save({ transaction });
                    } else if (q.questType === 'karaoke' && (node.type === 'karaoke' || req.body.nodeType === 'karaoke')) {
                        q.currentAmount = Math.min(q.targetAmount, (q.currentAmount || 0) + 1);
                        await q.save({ transaction });
                    }
                }
            } catch (questErr) {
                console.warn('⚠️ [completeNode] Quest progression update note:', questErr.message);
            }

            await UserActivity.create({
                userId,
                activityType: 'lesson',
                resourceId: nodeIndex,
                resourceTitle: `Lesson ${nodeIndex} (${courseId})`,
                activityDate: todayYMD,
                metadata: {
                    courseId,
                    attemptId,
                    xpEarned: finalXpEarned,
                    pearlsEarned: reward.pearlsEarned,
                    scorePct: reward.scorePct,
                    stars: reward.stars,
                    doubleXpApplied: isDoubleXpActive,
                },
            }, { transaction });

            const responseBody = {
                success: true,
                message: 'Node completed successfully',
                attemptId,
                xpEarned: finalXpEarned,
                pearlsEarned: reward.pearlsEarned,
                stars: reward.stars,
                scorePct: reward.scorePct,
                streakCount: user.streakCount,
                totalXp: user.totalXp,
                pearls: user.pearls,
                oxygen: user.oxygen,
                streakFreezeCount: user.streakFreezeCount || 0,
                isDoubleXpActive,
                unlockedNextIndex: nextNodeIndex,
                idempotentReplay: false,
                // Echo the authoritative course track so the client can
                // reconcile its active language instead of guessing.
                targetLanguage: targetLang,
                nativeLanguage: nativeLang,
                currentLevel: level,
            };
            await RewardTransaction.create({
                userId,
                kind: 'lesson',
                reference: attemptId,
                xpEarned: finalXpEarned,
                pearlsEarned: reward.pearlsEarned,
                responseBody,
            }, { transaction });

            return { status: 200, body: responseBody };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

function getWeeklyTimeBounds() {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday...
    const diffToMonday = (day + 6) % 7; // days since last Monday
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const msRemaining = Math.max(0, sunday.getTime() - now.getTime());
    const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const timeRemaining = `${daysRemaining}d ${hoursRemaining}h left`;

    return { monday, sunday, timeRemaining, msRemaining };
}

// 4. Leaderboard by League (Weekly cohorts, promotion/demotion tiers, and countdown)
exports.getLeaderboard = async (req, res, next) => {
    try {
        const league = req.query.league || req.user.currentLeague || 'Coral Reef';
        const { monday, sunday, timeRemaining } = getWeeklyTimeBounds();

        // 1. Calculate weekly XP from RewardTransaction since Monday 00:00 UTC
        const weeklyXpMap = {};
        const earliestRewardMap = {};
        try {
            const weeklyRewards = await RewardTransaction.findAll({
                where: {
                    createdAt: { [Op.gte]: monday },
                },
                attributes: ['userId', 'xpEarned', 'createdAt'],
                order: [['createdAt', 'ASC']],
                raw: true,
            });

            for (const r of weeklyRewards) {
                const uid = r.userId || r.user_id;
                weeklyXpMap[uid] = (weeklyXpMap[uid] || 0) + (parseInt(r.xpEarned || r.xp_earned, 10) || 0);
                if (!earliestRewardMap[uid] && r.createdAt) {
                    earliestRewardMap[uid] = new Date(r.createdAt).getTime();
                }
            }
        } catch (txErr) {
            console.warn('⚠️ [getLeaderboard] weeklyXp aggregation note:', txErr.message);
        }

        // 2. Fetch users in this league (fallback to all active users if < 3 users in league)
        let leagueUsers = await User.findAll({
            where: { isActive: true, currentLeague: league },
            attributes: ['id', 'name', 'avatar', 'totalXp', 'currentLeague', 'streakCount'],
            order: [['totalXp', 'DESC'], ['id', 'ASC']],
            limit: 30,
        });

        if (leagueUsers.length < 3) {
            leagueUsers = await User.findAll({
                where: { isActive: true },
                attributes: ['id', 'name', 'avatar', 'totalXp', 'currentLeague', 'streakCount'],
                order: [['totalXp', 'DESC'], ['id', 'ASC']],
                limit: 30,
            });
        }

        // 3. Map and rank by weekly XP (falling back to totalXp if 0 weekly XP)
        const userEntries = leagueUsers.map(u => {
            const weeklyXp = weeklyXpMap[u.id] !== undefined ? weeklyXpMap[u.id] : 0;
            return {
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                xp: weeklyXp || (u.totalXp || 0),
                weeklyXp,
                totalXp: u.totalXp || 0,
                streak: u.streakCount || 1,
                isCurrent: u.id === req.user.id,
                league: u.currentLeague || league,
                firstAchievedAt: earliestRewardMap[u.id] || null,
            };
        });

        // Ensure current requesting user is included
        const hasCurrentUser = userEntries.some(u => u.isCurrent);
        if (!hasCurrentUser && req.user) {
            const currentWeeklyXp = weeklyXpMap[req.user.id] !== undefined ? weeklyXpMap[req.user.id] : 0;
            userEntries.push({
                id: req.user.id,
                name: req.user.name,
                avatar: req.user.avatar,
                xp: currentWeeklyXp || (req.user.totalXp || 0),
                weeklyXp: currentWeeklyXp,
                totalXp: req.user.totalXp || 0,
                streak: req.user.streakCount || 1,
                isCurrent: true,
                league: req.user.currentLeague || league,
                firstAchievedAt: earliestRewardMap[req.user.id] || null,
            });
        }

        // Sort descending by weeklyXp, then totalXp, then streak.
        // Tie-breaker: earlier achievement timestamp (firstAchievedAt ASC), then stable ID (id ASC)
        userEntries.sort((a, b) => {
            if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
            if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
            if (b.streak !== a.streak) return b.streak - a.streak;
            if (a.firstAchievedAt && b.firstAchievedAt && a.firstAchievedAt !== b.firstAchievedAt) {
                return a.firstAchievedAt - b.firstAchievedAt;
            }
            return a.id - b.id;
        });

        // Assign ranks and promotion/demotion zones (top 10 advance, bottom 5 demote)
        const formatted = userEntries.slice(0, 30).map((u, idx) => {
            const rank = idx + 1;
            let tierZone = 'safe';
            if (rank <= 10) tierZone = 'promotion';
            else if (rank > 25) tierZone = 'demotion';

            return {
                ...u,
                rank,
                tierZone,
            };
        });

        res.status(200).json({
            success: true,
            league,
            timeRemaining,
            weekStart: monday.toISOString(),
            weekEnd: sunday.toISOString(),
            promotionZone: 10,
            demotionZone: 5,
            cohortSize: formatted.length,
            leaderboard: formatted,
        });
    } catch (error) {
        next(error);
    }
};

// 5. Refill Oxygen via Shop (Cost: 50 Pearls)
exports.refillOxygen = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            if (user.oxygen >= 5) {
                return { status: 400, body: { success: false, message: 'Oxygen is already full' } };
            }

            const cost = 50;
            if ((user.pearls || 0) < cost) {
                return { status: 400, body: { success: false, message: 'Not enough pearls (50 required)' } };
            }

            user.pearls -= cost;
            user.oxygen = 5;
            user.lastOxygenRefill = new Date();
            await user.save({ transaction });

            return {
                status: 200,
                body: {
                    success: true,
                    message: 'Oxygen fully restored!',
                    oxygen: user.oxygen,
                    pearls: user.pearls,
                },
            };
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

// 5b. Deduct Oxygen on Mistakes (Server-authoritative synchronization)
exports.deductOxygen = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            // Auto-refill catch-up first
            if (user.oxygen < 5 && user.lastOxygenRefill) {
                const now = new Date();
                const elapsedMs = now - new Date(user.lastOxygenRefill);
                const refillIntervalMs = 30 * 60 * 1000;
                const unitsToAdd = Math.floor(elapsedMs / refillIntervalMs);
                if (unitsToAdd > 0) {
                    user.oxygen = Math.min(5, user.oxygen + unitsToAdd);
                    user.lastOxygenRefill = new Date(new Date(user.lastOxygenRefill).getTime() + (unitsToAdd * refillIntervalMs));
                }
            }

            const currentOxygen = user.oxygen ?? 5;
            const newOxygen = Math.max(0, currentOxygen - 1);
            user.oxygen = newOxygen;
            if (newOxygen < 5 && !user.lastOxygenRefill) {
                user.lastOxygenRefill = new Date();
            }
            await user.save({ transaction });

            return {
                status: 200,
                body: {
                    success: true,
                    oxygen: user.oxygen,
                    message: 'Oxygen deducted successfully',
                },
            };
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

// 5c. Buy Streak Freeze (Cost: 100 Pearls)
exports.buyStreakFreeze = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const cost = 100;
            if ((user.pearls || 0) < cost) {
                return { status: 400, body: { success: false, message: 'Not enough pearls (100 required)' } };
            }

            user.pearls -= cost;
            user.streakFreezeCount = (user.streakFreezeCount || 0) + 1;
            await user.save({ transaction });

            return {
                status: 200,
                body: {
                    success: true,
                    message: 'Streak Freeze acquired! Your streak is now protected.',
                    pearls: user.pearls,
                    streakFreezeCount: user.streakFreezeCount,
                },
            };
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

// 5d. Buy Double XP Potion (Cost: 150 Pearls)
exports.buyDoubleXp = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const cost = 150;
            if ((user.pearls || 0) < cost) {
                return { status: 400, body: { success: false, message: 'Not enough pearls (150 required)' } };
            }

            user.pearls -= cost;
            // 30 minutes boost from now
            user.doubleXpExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
            await user.save({ transaction });

            return {
                status: 200,
                body: {
                    success: true,
                    message: 'Double XP Potion activated for 30 minutes!',
                    pearls: user.pearls,
                    isDoubleXpActive: true,
                    doubleXpExpiresAt: user.doubleXpExpiresAt,
                },
            };
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

// 6. Get Daily Quests (Auto-seed if not yet created for today)
exports.getQuests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Server-authoritative UTC date (anti-tamper: strictly ignore client-supplied timestamps)
        const todayYMD = new Date().toISOString().split('T')[0];

        let quests = await UserQuest.findAll({
            where: { userId, questDate: todayYMD },
            order: [['id', 'ASC']],
        });

        if (quests.length === 0) {
            // Seed today's 3 quests
            const initialQuests = [
                {
                    userId,
                    questTitle: 'Earn 30 XP in lessons',
                    questType: 'xp',
                    targetAmount: 30,
                    currentAmount: 0,
                    rewardPearls: 15,
                    rewardXp: 20,
                    questDate: todayYMD,
                },
                {
                    userId,
                    questTitle: 'Complete 1 German Karaoke track',
                    questType: 'karaoke',
                    targetAmount: 1,
                    currentAmount: 0,
                    rewardPearls: 20,
                    rewardXp: 25,
                    questDate: todayYMD,
                },
                {
                    userId,
                    questTitle: 'Practice 1 Sprechen pronunciation test',
                    questType: 'speech',
                    targetAmount: 1,
                    currentAmount: 0,
                    rewardPearls: 25,
                    rewardXp: 30,
                    questDate: todayYMD,
                },
            ];
            quests = await UserQuest.bulkCreate(initialQuests);
        }

        const formatted = quests.map(q => ({
            id: q.id,
            title: q.questTitle,
            type: q.questType,
            current: q.currentAmount,
            target: q.targetAmount,
            rewardPearls: q.rewardPearls,
            rewardXp: q.rewardXp,
            isCompleted: q.currentAmount >= q.targetAmount,
            isClaimed: q.isClaimed,
        }));

        res.status(200).json({ success: true, quests: formatted });
    } catch (error) {
        next(error);
    }
};

// 7. Claim Quest Reward
exports.claimQuest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { questId } = req.body;

        const quest = await UserQuest.findOne({ where: { id: questId, userId } });
        if (!quest) return res.status(404).json({ success: false, message: 'Quest not found' });

        if (quest.isClaimed) {
            return res.status(400).json({ success: false, message: 'Quest already claimed' });
        }

        if (quest.currentAmount < quest.targetAmount) {
            return res.status(400).json({ success: false, message: 'Quest not yet completed' });
        }

        quest.isClaimed = true;
        await quest.save();

        const user = await User.findByPk(userId);
        user.pearls = (user.pearls || 0) + quest.rewardPearls;
        user.totalXp = (user.totalXp || 0) + quest.rewardXp;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Reward claimed!',
            pearls: user.pearls,
            totalXp: user.totalXp,
            rewardPearls: quest.rewardPearls,
            rewardXp: quest.rewardXp,
        });
    } catch (error) {
        next(error);
    }
};

// 8. Switch Active Course Track (Target Language, Native Instruction, Level)
exports.switchCourse = async (req, res, next) => {
    try {
        const { targetLanguage, nativeLanguage, level } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (targetLanguage) user.targetLanguage = targetLanguage;
        if (nativeLanguage) user.nativeLanguage = nativeLanguage;
        if (level) user.currentLevel = level;

        const activeCourseId = `${user.targetLanguage || 'de'}_${user.nativeLanguage || 'en'}_${user.currentLevel || 'A1'}`.toLowerCase();
        const skipMap = parsePlacementSkipMap(user.placementSkipMap);
        if (Number.isInteger(skipMap[activeCourseId])) {
            user.placementSkipToNode = skipMap[activeCourseId];
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Course track updated successfully',
            status: {
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage,
                currentLevel: user.currentLevel || 'A1',
                placementCompleted: !!user.placementCompleted,
                placementLevel: user.placementLevel || null,
                placementSkipToNode: getEffectiveSkipNodeForCourse(user, activeCourseId),
                unlockedLevels: parseUnlockedLevels(user.unlockedLevels),
            }
        });
    } catch (error) {
        next(error);
    }
};

function formatLessonPayload(lesson, { excludeStageTypes = null } = {}) {
    const activeStages = sanitizeLessonStages(lesson.stages).filter(s => s && s.enabled !== false);
    let stages = activeStages;
    if (excludeStageTypes && excludeStageTypes.size > 0) {
        const filtered = activeStages.filter(s => !excludeStageTypes.has(s.type));
        // Fall back to all active stages if a custom lesson only contains excluded stage types.
        if (filtered.length > 0) {
            stages = filtered;
        }
    }

    return {
        id: lesson.id,
        sectionNumber: lesson.sectionNumber,
        sectionTitle: lesson.sectionTitle,
        unitNumber: lesson.unitNumber,
        unitTitle: lesson.unitTitle,
        unitDescription: lesson.unitDescription,
        lessonIndex: lesson.lessonIndex,
        title: lesson.title,
        subtitle: lesson.subtitle,
        nodeType: lesson.nodeType,
        xpReward: lesson.xpReward,
        pearlsReward: lesson.pearlsReward,
        stages,
        karaokeData: lesson.karaokeData,
        audioUrl: lesson.audioUrl,
        sourceNoteId: lesson.sourceNoteId,
        updatedAt: lesson.updatedAt
            ? (typeof lesson.updatedAt.toISOString === 'function' ? lesson.updatedAt.toISOString() : String(lesson.updatedAt))
            : null,
    };
}

// 9. Get full interactive stage data for a single lesson on demand
exports.getLessonDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lesson = await CurriculumLesson.findByPk(id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        res.status(200).json({
            success: true,
            lesson: formatLessonPayload(lesson),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 10. Claim Rewarded Ad Reward (Authenticated & Server-Authoritative)
 * Route: POST /api/gamification/claim-ad-reward
 * Body: { rewardType: 'oxygen' | 'pearls' | 'double_xp', attemptId?: string }
 */
exports.claimAdReward = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { rewardType = 'oxygen', attemptId } = req.body;

        if (!['oxygen', 'pearls', 'double_xp'].includes(rewardType)) {
            return res.status(400).json({ success: false, message: 'Invalid rewardType. Expected: oxygen, pearls, or double_xp' });
        }

        const requireAdmobSsv = process.env.REQUIRE_ADMOB_SSV === 'true';

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);

            // 1. Check for recent cryptographically verified AdMob SSV transaction (within last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentSsvTx = await RewardTransaction.findOne({
                where: {
                    userId,
                    kind: 'admob',
                    createdAt: { [Op.gte]: fiveMinutesAgo },
                },
                order: [['createdAt', 'DESC']],
                transaction,
            });

            if (recentSsvTx) {
                const resp = recentSsvTx.responseBody || {};
                if (!resp.reconciledByClient) {
                    resp.reconciledByClient = true;
                    recentSsvTx.responseBody = resp;
                    await recentSsvTx.save({ transaction });
                }
                return {
                    status: 200,
                    body: {
                        success: true,
                        message: 'Reward confirmed via verified AdMob SSV.',
                        verifiedByAdMob: true,
                        rewardType: resp.rewardType || rewardType,
                        oxygenEarned: recentSsvTx.oxygenEarned,
                        pearlsEarned: recentSsvTx.pearlsEarned,
                        xpEarned: recentSsvTx.xpEarned,
                        oxygen: user.oxygen,
                        pearls: user.pearls,
                        totalXp: user.totalXp,
                    }
                };
            }

            // 2. If strict SSV mode is enabled and no verified AdMob callback was received, reject
            if (requireAdmobSsv) {
                return {
                    status: 400,
                    body: {
                        success: false,
                        message: 'Ad reward must be verified via AdMob SSV callback.'
                    }
                };
            }

            // 3. Transitional Mode: Enforce physical ad-duration cooldown (minimum 35 seconds between claims)
            const latestAdTx = await RewardTransaction.findOne({
                where: {
                    userId,
                    kind: { [Op.in]: ['admob', 'client_ad'] },
                },
                order: [['createdAt', 'DESC']],
                transaction,
            });

            if (latestAdTx) {
                const elapsedMs = Date.now() - new Date(latestAdTx.createdAt).getTime();
                const MIN_AD_COOLDOWN_MS = 35 * 1000;
                if (elapsedMs < MIN_AD_COOLDOWN_MS) {
                    const waitSec = Math.ceil((MIN_AD_COOLDOWN_MS - elapsedMs) / 1000);
                    return {
                        status: 429,
                        body: {
                            success: false,
                            message: `Please wait ${waitSec}s for the ad to complete before claiming rewards.`
                        }
                    };
                }
            }

            // 4. Daily hard limit check (max 6 rewarded ads per 24 hours across admob and client_ad)
            const adsToday = await RewardTransaction.count({
                where: {
                    userId,
                    kind: { [Op.in]: ['admob', 'client_ad'] },
                    createdAt: { [Op.gte]: todayStart },
                },
                transaction,
            });

            if (adsToday >= 6) {
                return { status: 429, body: { success: false, message: 'Daily rewarded ad limit reached (6/6)' } };
            }

            let xpEarned = 0;
            let pearlsEarned = 0;
            let oxygenEarned = 0;

            if (rewardType === 'oxygen') {
                const previousOxygen = user.oxygen ?? 0;
                user.oxygen = Math.min(5, previousOxygen + 3);
                user.lastOxygenRefill = new Date();
                oxygenEarned = user.oxygen - previousOxygen;
            } else if (rewardType === 'pearls') {
                pearlsEarned = 25;
                user.pearls = (user.pearls || 0) + pearlsEarned;
            } else if (rewardType === 'double_xp') {
                if (attemptId) {
                    const lesson = await RewardTransaction.findOne({
                        where: { userId, kind: 'lesson', reference: attemptId },
                        transaction,
                    });
                    if (lesson) {
                        xpEarned = lesson.xpEarned;
                        user.totalXp = (user.totalXp || 0) + xpEarned;
                    }
                }
            }

            await user.save({ transaction });

            const transactionRef = `client-ad-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const responseBody = {
                success: true,
                message: rewardType === 'oxygen'
                    ? `Reward credited: +${oxygenEarned} Oxygen bubbles! 🫧`
                    : (rewardType === 'pearls' ? `Reward credited: +${pearlsEarned} Pearls! 💎` : `Double XP reward credited! ⚡`),
                rewardType,
                oxygenEarned,
                pearlsEarned,
                xpEarned,
                oxygen: user.oxygen,
                pearls: user.pearls,
                totalXp: user.totalXp,
            };

            await RewardTransaction.create({
                userId,
                kind: 'client_ad',
                reference: transactionRef,
                xpEarned,
                pearlsEarned,
                oxygenEarned,
                responseBody,
            }, { transaction });

            return { status: 200, body: responseBody };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};


/**
 * 10b. Emergency oxygen refill (used when no rewarded/interstitial ad can be loaded)
 * Route: POST /api/gamification/emergency-refill
 * Grants +1 oxygen, only when the learner has 0 oxygen, at most once per cooldown window.
 */
const EMERGENCY_REFILL_COOLDOWN_MS = 4 * 60 * 60 * 1000;

exports.emergencyRefill = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            if ((user.oxygen ?? 0) > 0) {
                return {
                    status: 400,
                    body: { success: false, message: 'You still have oxygen. Emergency refill is only for 0 oxygen.', oxygen: user.oxygen },
                };
            }

            const last = await RewardTransaction.findOne({
                where: { userId, kind: 'emergency_refill' },
                order: [['createdAt', 'DESC']],
                transaction,
            });
            if (last) {
                const elapsedMs = Date.now() - new Date(last.createdAt).getTime();
                if (elapsedMs < EMERGENCY_REFILL_COOLDOWN_MS) {
                    const retryAfterSec = Math.ceil((EMERGENCY_REFILL_COOLDOWN_MS - elapsedMs) / 1000);
                    return {
                        status: 429,
                        body: {
                            success: false,
                            message: 'Emergency refill already used recently.',
                            retryAfterSec,
                        },
                    };
                }
            }

            user.oxygen = 1;
            if (!user.lastOxygenRefill) user.lastOxygenRefill = new Date();
            await user.save({ transaction });

            const responseBody = {
                success: true,
                message: 'Emergency refill: +1 Oxygen bubble 🫧',
                rewardType: 'emergency_refill',
                oxygenEarned: 1,
                pearlsEarned: 0,
                xpEarned: 0,
                oxygen: user.oxygen,
                pearls: user.pearls,
                totalXp: user.totalXp,
            };

            await RewardTransaction.create({
                userId,
                kind: 'emergency_refill',
                reference: `emergency-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                xpEarned: 0,
                pearlsEarned: 0,
                oxygenEarned: 1,
                responseBody,
            }, { transaction });

            return { status: 200, body: responseBody };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};


exports.handleAdMobReward = async (req, res, next) => {
    try {
        const rawQuery = req.originalUrl.split('?').slice(1).join('?');
        if (!rawQuery || !(await verifyAdMobQuery(rawQuery))) {
            return res.status(400).json({ success: false, message: 'Invalid AdMob signature' });
        }

        const timestamp = Number(req.query.timestamp);
        if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 24 * 60 * 60) {
            return res.status(400).json({ success: false, message: 'Expired AdMob callback' });
        }

        const userId = Number(req.query.user_id);
        const transactionId = req.query.transaction_id;
        if (!Number.isInteger(userId) || userId <= 0 ||
            typeof transactionId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(transactionId)) {
            return res.status(400).json({ success: false, message: 'Invalid AdMob reward identity' });
        }
        if (process.env.ADMOB_REWARDED_AD_UNIT_ID && req.query.ad_unit !== process.env.ADMOB_REWARDED_AD_UNIT_ID) {
            return res.status(400).json({ success: false, message: 'Unexpected ad unit' });
        }

        let customData;
        try {
            customData = JSON.parse(req.query.custom_data || '{}');
        } catch (_) {
            return res.status(400).json({ success: false, message: 'Invalid reward metadata' });
        }
        const rewardType = customData.rewardType;
        if (!['oxygen', 'pearls', 'double_xp'].includes(rewardType)) {
            return res.status(400).json({ success: false, message: 'Invalid reward type' });
        }

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const existing = await RewardTransaction.findOne({
                where: { userId, kind: 'admob', reference: transactionId },
                transaction,
            });
            if (existing) {
                return { status: 200, body: { ...existing.responseBody, idempotentReplay: true } };
            }

            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const adsToday = await RewardTransaction.count({
                where: {
                    userId,
                    kind: { [Op.in]: ['admob', 'client_ad'] },
                    createdAt: { [Op.gte]: todayStart },
                },
                transaction,
            });
            if (adsToday >= 6) {
                return { status: 429, body: { success: false, message: 'Daily rewarded ad limit reached' } };
            }

            let xpEarned = 0;
            let pearlsEarned = 0;
            let oxygenEarned = 0;
            if (rewardType === 'oxygen') {
                const previousOxygen = user.oxygen || 0;
                user.oxygen = Math.min(5, previousOxygen + 3);
                user.lastOxygenRefill = new Date();
                oxygenEarned = user.oxygen - previousOxygen;
            } else if (rewardType === 'pearls') {
                pearlsEarned = 25;
                user.pearls = (user.pearls || 0) + pearlsEarned;
            } else {
                const lesson = await RewardTransaction.findOne({
                    where: { userId, kind: 'lesson', reference: customData.attemptId || '' },
                    transaction,
                });
                if (!lesson) {
                    return { status: 400, body: { success: false, message: 'Lesson reward not found for double XP' } };
                }
                xpEarned = lesson.xpEarned;
                user.totalXp = (user.totalXp || 0) + xpEarned;
            }

            await user.save({ transaction });
            const responseBody = {
                success: true,
                transactionId,
                rewardType,
                xpEarned,
                pearlsEarned,
                oxygenEarned,
                oxygen: user.oxygen,
                pearls: user.pearls,
                totalXp: user.totalXp,
                idempotentReplay: false,
                reconciledByClient: false,
            };
            await RewardTransaction.create({
                userId,
                kind: 'admob',
                reference: transactionId,
                xpEarned,
                pearlsEarned,
                oxygenEarned,
                responseBody,
            }, { transaction });
            return { status: 200, body: responseBody };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 11. DUOLINGO-STYLE DIAGNOSTIC PLACEMENT TEST & SECTION JUMP ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function buildDiagnosticPlacementQuestions(targetLang = 'de', nativeLang = 'en') {
    const isEnTarget = targetLang === 'en';
    const nLang = nativeLang || (isEnTarget ? 'mr' : 'en');

    const tr = (en, hi, mr) => {
        if (nLang === 'hi') return hi;
        if (nLang === 'mr') return mr;
        return en;
    };

    if (isEnTarget) {
        return [
            // A1 Tier (Questions 1-4)
            {
                id: 'en_a1_1',
                cefr: 'A1',
                skill: 'vocabulary',
                type: 'cloze_test',
                prompt: tr('Select the correct English greeting for the morning:', 'सुबह के अभिवादन के लिए सही अंग्रेजी शब्द चुनें:', 'सकाळच्या अभिवादनासाठी योग्य इंग्रजी पर्याय निवडा:'),
                sentence: '_____! How are you today?',
                translation: tr('Good morning! How are you today?', 'सुप्रभात! आज आप कैसे हैं?', 'शुभ सकाळ! आज तुम्ही कसे आहात?'),
                options: ['Good morning', 'Good night', 'Goodbye'],
                correctAnswer: 'Good morning',
            },
            {
                id: 'en_a1_2',
                cefr: 'A1',
                skill: 'grammar',
                type: 'cloze_test',
                prompt: tr('Fill in the blank with the correct verb:', 'सही क्रिया (verb) से खाली स्थान भरें:', 'योग्य क्रियापद वापरून रिकामी जागा भरा:'),
                sentence: 'She _____ a doctor at the city hospital.',
                translation: tr('She is a doctor at the city hospital.', 'वह शहर के अस्पताल में एक डॉक्टर हैं।', 'ती शहरातील रुग्णालयात डॉक्टर आहे.'),
                options: ['is', 'are', 'am'],
                correctAnswer: 'is',
            },
            {
                id: 'en_a1_3',
                cefr: 'A1',
                skill: 'listening',
                type: 'listen_select',
                prompt: tr('Listen and choose what the speaker needs:', 'सुनें और चुनें कि वक्ता को क्या चाहिए:', 'ऐका आणि वक्त्याला काय हवे आहे ते निवडा:'),
                sentence: 'Excuse me, where is the train station?',
                translation: tr('Excuse me, where is the train station?', 'क्षमा करें, रेलवे स्टेशन कहाँ है?', 'माफ करा, रेल्वे स्टेशन कुठे आहे?'),
                options: [
                    tr('Directions to the train station', 'रेलवे स्टेशन का रास्ता', 'रेल्वे स्टेशनचा पत्ता'),
                    tr('A cup of hot coffee', 'एक कप गर्म कॉफी', 'एक कप गरम कॉफी'),
                    tr('A hotel room key', 'होटल के कमरे की चाबी', 'हॉटेलच्या खोलीची किल्ली'),
                ],
                correctAnswer: tr('Directions to the train station', 'रेलवे स्टेशन का रास्ता', 'रेल्वे स्टेशनचा पत्ता'),
            },
            {
                id: 'en_a1_4',
                cefr: 'A1',
                skill: 'sentence',
                type: 'sentence_builder',
                prompt: tr('Arrange the words: "I live in India"', 'शब्दों को सही क्रम में लगाएं: "मैं भारत में रहता हूँ"', 'शब्द योग्य क्रमाने लावा: "मी भारतात राहतो"'),
                targetSentence: 'I live in India',
                tokens: ['I', 'live', 'in', 'India', 'lives', 'from'],
                correctAnswer: 'I live in India',
            },
            // A2 Tier (Questions 5-8)
            {
                id: 'en_a2_1',
                cefr: 'A2',
                skill: 'grammar',
                type: 'cloze_test',
                prompt: tr('Choose the correct past tense form:', 'सही भूतकाल (Past Tense) रूप चुनें:', 'योग्य भूतकाळाचे रूप निवडा:'),
                sentence: 'Yesterday, we _____ to the market to buy fresh fruit.',
                translation: tr('Yesterday, we went to the market to buy fresh fruit.', 'कल हम ताजे फल खरीदने बाजार गए थे।', 'काल आम्ही ताजी फळे खरेदी करण्यासाठी बाजारात गेलो होतो.'),
                options: ['went', 'goed', 'gone'],
                correctAnswer: 'went',
            },
            {
                id: 'en_a2_2',
                cefr: 'A2',
                skill: 'vocabulary',
                type: 'dialogue_bubble',
                partnerName: 'Sarah',
                partnerMessage: 'Could you please pass me the salt?',
                prompt: tr('Choose the most natural polite response:', 'सबसे स्वाभाविक विनम्र उत्तर चुनें:', 'सर्वात नैसर्गिक आणि नम्र उत्तर निवडा:'),
                options: [
                    'Sure, here you go!',
                    'No, I am yesterday.',
                    'Where is the salt going?',
                ],
                correctAnswer: 'Sure, here you go!',
            },
            {
                id: 'en_a2_3',
                cefr: 'A2',
                skill: 'grammar',
                type: 'cloze_test',
                prompt: tr('Complete the comparison:', 'तुलना पूरी करें:', 'तुलना पूर्ण करा:'),
                sentence: 'Mumbai is _____ than my hometown.',
                translation: tr('Mumbai is bigger than my hometown.', 'मुंबई मेरे गृहनगर से बड़ा है।', 'मुंबई माझ्या गावापेक्षा मोठी आहे.'),
                options: ['bigger', 'more big', 'biggest'],
                correctAnswer: 'bigger',
            },
            {
                id: 'en_a2_4',
                cefr: 'A2',
                skill: 'listening',
                type: 'listen_select',
                prompt: tr('Listen and identify when the meeting starts:', 'सुनें और बताएं कि मीटिंग कब शुरू होगी:', 'ऐका आणि मीटिंग कधी सुरू होईल ते ओळखा:'),
                sentence: 'Our flight was delayed, so the meeting will start at half past three.',
                translation: tr('The meeting will start at 3:30.', 'मीटिंग 3:30 बजे शुरू होगी।', 'मीटिंग ३:३० वाजता सुरू होईल.'),
                options: ['At 3:30', 'At 2:30', 'At 4:00'],
                correctAnswer: 'At 3:30',
            },
            // B1 Tier (Questions 9-12)
            {
                id: 'en_b1_1',
                cefr: 'B1',
                skill: 'grammar',
                type: 'cloze_test',
                prompt: tr('Complete the conditional sentence:', 'शर्तवाचक वाक्य (Conditional) पूरा करें:', 'अट दर्शवणारे वाक्य पूर्ण करा:'),
                sentence: 'If I had known about the traffic, I _____ earlier.',
                translation: tr('If I had known about the traffic, I would have left earlier.', 'अगर मुझे ट्रैफिक के बारे में पता होता, तो मैं पहले निकल जाता।', 'जर मला ट्रॅफिकबद्दल माहित असते, तर मी लवकर निघालो असतो.'),
                options: ['would have left', 'will leave', 'had left'],
                correctAnswer: 'would have left',
            },
            {
                id: 'en_b1_2',
                cefr: 'B1',
                skill: 'grammar',
                type: 'cloze_test',
                prompt: tr('Select the correct present perfect continuous form:', 'सही व्याकरण विकल्प चुनें:', 'योग्य व्याकरण पर्याय निवडा:'),
                sentence: 'She _____ at this software company since 2021.',
                translation: tr('She has been working at this software company since 2021.', 'वह 2021 से इस सॉफ्टवेयर कंपनी में काम कर रही है।', 'ती २०२१ पासून या सॉफ्टवेअर कंपनीत काम करत आहे.'),
                options: ['has been working', 'is working', 'worked'],
                correctAnswer: 'has been working',
            },
            {
                id: 'en_b1_3',
                cefr: 'B1',
                skill: 'vocabulary',
                type: 'dialogue_bubble',
                partnerName: 'Manager',
                partnerMessage: 'We need to postpone the product launch until nextWednesday.',
                prompt: tr('What does "postpone" mean in this context?', 'यहाँ "postpone" का क्या अर्थ है?', 'या संदर्भात "postpone" चा अर्थ काय आहे?'),
                options: [
                    tr('Reschedule to a later time', 'बाद के समय के लिए टालना', 'पुढील वेळेवर ढकलणे'),
                    tr('Cancel the project permanently', 'हमेशा के लिए रद्द करना', 'कायमचे रद्द करणे'),
                    tr('Start the launch immediately', 'तुरंत शुरू करना', 'ताबडतोब सुरू करणे'),
                ],
                correctAnswer: tr('Reschedule to a later time', 'बाद के समय के लिए टालना', 'पुढील वेळेवर ढकलणे'),
            },
            {
                id: 'en_b1_4',
                cefr: 'B1',
                skill: 'sentence',
                type: 'sentence_builder',
                prompt: tr('Construct the complex sentence:', 'जटिल वाक्य बनाएं:', 'वाक्य पूर्ण करा:'),
                targetSentence: 'Although it was raining we enjoyed the trip',
                tokens: ['Although', 'it', 'was', 'raining', 'we', 'enjoyed', 'the', 'trip', 'because'],
                correctAnswer: 'Although it was raining we enjoyed the trip',
            },
        ];
    }

    // German Target ('de')
    return [
        // A1 Tier (Questions 1-4)
        {
            id: 'de_a1_1',
            cefr: 'A1',
            skill: 'vocabulary',
            type: 'cloze_test',
            prompt: tr('Choose the correct German greeting for the morning:', 'सुबह के लिए सही जर्मन अभिवादन चुनें:', 'सकाळसाठी योग्य जर्मन अभिवादन निवडा:'),
            sentence: '_____! Wie geht es dir?',
            translation: tr('Good morning! How are you?', 'सुप्रभात! आप कैसे हैं?', 'शुभ सकाळ! तुम्ही कसे आहात?'),
            options: ['Guten Morgen', 'Gute Nacht', 'Auf Wiedersehen'],
            correctAnswer: 'Guten Morgen',
        },
        {
            id: 'de_a1_2',
            cefr: 'A1',
            skill: 'grammar',
            type: 'cloze_test',
            prompt: tr('Select the correct verb conjugation:', 'सही क्रिया रूप चुनें:', 'योग्य क्रियापद रूप निवडा:'),
            sentence: 'Ich _____ aus Indien und wohne in Berlin.',
            translation: tr('I come from India and live in Berlin.', 'मैं भारत से हूँ और बर्लिन में रहता हूँ।', 'मी भारताचा आहे आणि बर्लिनमध्ये राहतो.'),
            options: ['komme', 'kommst', 'kommt'],
            correctAnswer: 'komme',
        },
        {
            id: 'de_a1_3',
            cefr: 'A1',
            skill: 'listening',
            type: 'listen_select',
            prompt: tr('Listen and choose what the customer orders:', 'सुनें और चुनें कि ग्राहक क्या ऑर्डर कर रहा है:', 'ऐका आणि ग्राहक काय ऑर्डर करत आहे ते निवडा:'),
            sentence: 'Ich möchte bitte einen Kaffee und ein Wasser.',
            translation: tr('I would like a coffee and a water, please.', 'मुझे कृपया एक कॉफी और एक पानी चाहिए।', 'मला कृपया एक कॉफी आणि एक पाणी हवे आहे.'),
            options: [
                tr('One coffee and one water', 'एक कॉफी और एक पानी', 'एक कॉफी आणि एक पाणी'),
                tr('Two teas and bread', 'दो चाय और ब्रेड', 'दोन चहा आणि ब्रेड'),
                tr('The restaurant bill', 'रेस्तरां का बिल', 'हॉटेलचे बिल'),
            ],
            correctAnswer: tr('One coffee and one water', 'एक कॉफी और एक पानी', 'एक कॉफी आणि एक पाणी'),
        },
        {
            id: 'de_a1_4',
            cefr: 'A1',
            skill: 'sentence',
            type: 'sentence_builder',
            prompt: tr('Translate: "My name is Anna"', 'अनुवाद करें: "मेरा नाम अन्ना है"', 'भाषांतर करा: "माझे नाव अन्ना आहे"'),
            targetSentence: 'Ich heiße Anna',
            tokens: ['Ich', 'heiße', 'Anna', 'du', 'bin', 'heißt'],
            correctAnswer: 'Ich heiße Anna',
        },
        // A2 Tier (Questions 5-8)
        {
            id: 'de_a2_1',
            cefr: 'A2',
            skill: 'grammar',
            type: 'cloze_test',
            prompt: tr('Complete the Perfekt (past tense) sentence:', 'भूतकाल (Perfekt) वाक्य पूरा करें:', 'भूतकाळातील (Perfekt) वाक्य पूर्ण करा:'),
            sentence: 'Gestern _____ ich ins Kino gegangen.',
            translation: tr('Yesterday I went to the cinema.', 'कल मैं सिनेमा गया था।', 'काल मी सिनेमाला गेलो होतो.'),
            options: ['bin', 'habe', 'war'],
            correctAnswer: 'bin',
        },
        {
            id: 'de_a2_2',
            cefr: 'A2',
            skill: 'grammar',
            type: 'cloze_test',
            prompt: tr('Choose the correct subordinate clause word order (weil):', '"weil" के साथ सही शब्द क्रम चुनें:', '"weil" सह योग्य शब्दक्रम निवडा:'),
            sentence: 'Ich lerne Deutsch, weil ich in Deutschland _____ möchte.',
            translation: tr('I am learning German because I want to work in Germany.', 'मैं जर्मन सीख रहा हूँ क्योंकि मैं जर्मनी में काम करना चाहता हूँ।', 'मी जर्मन शिकत आहे कारण मला जर्मनीमध्ये काम करायचे आहे.'),
            options: ['arbeiten', 'arbeite', 'gearbeitet'],
            correctAnswer: 'arbeiten',
        },
        {
            id: 'de_a2_3',
            cefr: 'A2',
            skill: 'vocabulary',
            type: 'dialogue_bubble',
            partnerName: 'Lukas',
            partnerMessage: 'Entschuldigung, wie komme ich zum Hauptbahnhof?',
            prompt: tr('Choose the most natural reply:', 'सबसे सही उत्तर चुनें:', 'सर्वात योग्य उत्तर निवडा:'),
            options: [
                'Gehen Sie hier geradeaus und dann links.',
                'Ich habe gestern im Bahnhof geschlafen.',
                'Der Zug schmeckt sehr gut.',
            ],
            correctAnswer: 'Gehen Sie hier geradeaus und dann links.',
        },
        {
            id: 'de_a2_4',
            cefr: 'A2',
            skill: 'listening',
            type: 'listen_select',
            prompt: tr('Listen and identify when the train departs:', 'सुनें और बताएं कि ट्रेन कब छूटेगी:', 'ऐका आणि ट्रेन कधी सुटेल ते सांगा:'),
            sentence: 'Der ICE nach München fährt heute auf Gleis vier um halb neun ab.',
            translation: tr('The ICE to Munich departs today on track 4 at 8:30.', 'म्यूनिख के लिए ट्रेन आज प्लेटफॉर्म 4 से 8:30 बजे रवाना होगी।', 'म्युनिकची ट्रेन आज फलाट ४ वरून ८:३० वाजता सुटेल.'),
            options: ['08:30 (Track 4)', '09:30 (Track 4)', '08:15 (Track 2)'],
            correctAnswer: '08:30 (Track 4)',
        },
        // B1 Tier (Questions 9-12)
        {
            id: 'de_b1_1',
            cefr: 'B1',
            skill: 'grammar',
            type: 'cloze_test',
            prompt: tr('Choose the correct Konjunktiv II (polite/hypothetical) form:', 'सही Konjunktiv II रूप चुनें:', 'योग्य Konjunktiv II रूप निवडा:'),
            sentence: 'Wenn ich mehr Zeit hätte, _____ ich jeden Tag Sport machen.',
            translation: tr('If I had more time, I would play sports every day.', 'यदि मेरे पास अधिक समय होता, तो मैं हर दिन खेलकूद करता।', 'जर माझ्याकडे जास्त वेळ असता, तर मी दररोज व्यायाम केला असता.'),
            options: ['würde', 'werde', 'wurde'],
            correctAnswer: 'würde',
        },
        {
            id: 'de_b1_2',
            cefr: 'B1',
            skill: 'grammar',
            type: 'cloze_test',
            prompt: tr('Select the correct genitive conjunction (obwohl / trotz):', 'सही व्याकरण विकल्प चुनें:', 'योग्य व्याकरण पर्याय निवडा:'),
            sentence: '_____ es stark regnete, sind wir spazieren gegangen.',
            translation: tr('Although it was raining heavily, we went for a walk.', 'हालाँकि तेज़ बारिश हो रही थी, फिर भी हम टहलने गए।', 'जोरदार पाऊस पडत असूनही आम्ही फिरायला गेलो.'),
            options: ['Obwohl', 'Trotzdem', 'Wegen'],
            correctAnswer: 'Obwohl',
        },
        {
            id: 'de_b1_3',
            cefr: 'B1',
            skill: ' grammar',
            type: 'cloze_test',
            prompt: tr('Select the correct relative pronoun in Dative:', 'सही संबंधवाचक सर्वनाम (Relative Pronoun) चुनें:', 'योग्य सर्वनाम (Relative Pronoun) निवडा:'),
            sentence: 'Das ist der Kollege, _____ ich gestern bei der Arbeit geholfen habe.',
            translation: tr('That is the colleague whom I helped at work yesterday.', 'यह वह सहकर्मी है जिसकी मैंने कल काम में मदद की थी।', 'हा तोच सहकारी आहे ज्याला मी काल कामात मदत केली.'),
            options: ['dem', 'den', 'der'],
            correctAnswer: 'dem',
        },
        {
            id: 'de_b1_4',
            cefr: 'B1',
            skill: 'sentence',
            type: 'sentence_builder',
            prompt: tr('Construct the B1 sentence:', 'B1 स्तर का जर्मन वाक्य बनाएं:', 'B1 स्तराचे जर्मन वाक्य तयार करा:'),
            targetSentence: 'Obwohl ich müde bin gehe ich heute zum Training',
            tokens: ['Obwohl', 'ich', 'müde', 'bin', 'gehe', 'ich', 'heute', 'zum', 'Training', 'weil'],
            correctAnswer: 'Obwohl ich müde bin gehe ich heute zum Training',
        },
    ];
}

async function resolveSection2StartNodeIndex(targetLang, nativeLang, level = 'A1') {
    const allLessons = await CurriculumLesson.findAll({
        where: {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level,
        },
        attributes: ['id', 'sectionNumber', 'sectionTitle', 'unitNumber', 'lessonIndex', 'title'],
        order: [
            ['sectionNumber', 'ASC'],
            ['unitNumber', 'ASC'],
            ['lessonIndex', 'ASC'],
            ['id', 'ASC'],
        ],
        raw: true,
    });

    if (!Array.isArray(allLessons) || allLessons.length === 0) {
        return {
            nodeIndex: 35,
            targetUnitNumber: 1,
            targetSectionNumber: 2,
            targetSectionTitle: 'Explorer',
        };
    }

    // 1. Look for the exact start of Section 2 (sectionNumber >= 2, or legacy unitNumber >= 36)
    const sec2Idx = allLessons.findIndex(l => (l.sectionNumber && l.sectionNumber >= 2) || (l.unitNumber || 1) >= 36);
    if (sec2Idx !== -1) {
        return {
            nodeIndex: sec2Idx,
            targetUnitNumber: allLessons[sec2Idx].unitNumber || 1,
            targetSectionNumber: allLessons[sec2Idx].sectionNumber >= 2 ? allLessons[sec2Idx].sectionNumber : 2,
            targetSectionTitle: (allLessons[sec2Idx].sectionTitle && allLessons[sec2Idx].sectionTitle !== 'Rookie')
                ? allLessons[sec2Idx].sectionTitle
                : 'Explorer',
        };
    }

    // 2. If the course only has Section 1 units published in DB right now,
    // route to the second half of published units so the skip pointer is always valid and in-bounds!
    const maxUnit = allLessons.reduce((acc, l) => Math.max(acc, l.unitNumber || 1), 1);
    if (maxUnit >= 2) {
        const fallbackUnit = Math.max(2, Math.floor(maxUnit / 2) + 1);
        const midIdx = allLessons.findIndex(l => (l.unitNumber || 1) >= fallbackUnit);
        if (midIdx > 0) {
            return {
                nodeIndex: midIdx,
                targetUnitNumber: allLessons[midIdx].unitNumber || fallbackUnit,
                targetSectionNumber: 2,
                targetSectionTitle: 'Explorer',
            };
        }
    }

    const fallbackIdx = allLessons.length > 1 ? Math.floor(allLessons.length / 2) : 0;
    return {
        nodeIndex: fallbackIdx,
        targetUnitNumber: allLessons[fallbackIdx]?.unitNumber || 1,
        targetSectionNumber: 2,
        targetSectionTitle: 'Explorer',
    };
}

/**
 * Locate Section 2, Unit 4, Lesson 4 (0-indexed lessonIndex = 3) for onboarding placement.
 * Supports both normalized per-section units (sectionNumber=2, unitNumber=4) and legacy
 * sequential numbering (sectionNumber=1, unitNumber=39).
 */
async function findSection2GateLesson(targetLang, nativeLang, level = 'A1') {
    return CurriculumLesson.findOne({
        where: {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level,
            [Op.or]: [
                { sectionNumber: 2, unitNumber: 4, lessonIndex: 3 },
                { sectionNumber: 1, unitNumber: 39, lessonIndex: 3 },
            ],
        },
        order: [
            ['sectionNumber', 'DESC'],
            ['unitNumber', 'ASC'],
            ['lessonIndex', 'ASC'],
            ['id', 'ASC'],
        ],
    });
}

async function computeA1Frontier(user, userId, a1CourseId, transaction) {
    const existingSkip = getEffectiveSkipNodeForCourse(user, a1CourseId);
    const highestCompleted = await UserNodeProgress.max('nodeIndex', {
        where: { userId, courseId: a1CourseId, status: 'completed' },
        transaction,
    });
    return Math.max(
        existingSkip,
        Number.isInteger(highestCompleted) ? highestCompleted + 1 : 0
    );
}

/**
 * 11a-gate. Fetch Section 2 Gate Lesson (Section 2, Unit 4, Lesson 4) for Onboarding Placement
 * Route: GET /api/gamification/placement/lesson
 */
exports.getPlacementLesson = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        const targetLang = req.query.targetLanguage || user?.targetLanguage || 'de';
        const nativeLang = req.query.nativeLanguage || user?.nativeLanguage || (targetLang === 'en' ? 'mr' : 'en');
        const level = req.query.level || 'A1';

        const lesson = await findSection2GateLesson(targetLang, nativeLang, level);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                code: 'PLACEMENT_LESSON_UNAVAILABLE',
                message: 'Section 2 placement lesson is not published for this course yet.',
            });
        }

        const payload = formatLessonPayload(lesson, { excludeStageTypes: PLACEMENT_EXCLUDED_STAGE_TYPES });
        if (!payload.stages || payload.stages.length === 0) {
            return res.status(404).json({
                success: false,
                code: 'PLACEMENT_LESSON_UNAVAILABLE',
                message: 'Section 2 placement lesson has no interactive stages available.',
            });
        }

        const destinationSection2 = await resolveSection2StartNodeIndex(targetLang, nativeLang, level);

        return res.status(200).json({
            success: true,
            placementMode: 'section2_gate',
            targetLanguage: targetLang,
            nativeLanguage: nativeLang,
            level,
            passRules: {
                minScorePct: PLACEMENT_MIN_SCORE_PCT,
                maxMistakes: PLACEMENT_MAX_MISTAKES,
            },
            destinationSection2,
            lesson: payload,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 11a. Fetch Calibrated Diagnostic Placement Questions (or Section Jump Test Questions)
 * Route: GET / POST /api/gamification/placement/questions
 */
exports.getPlacementQuestions = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        const targetLang = req.query.targetLanguage || req.body?.targetLanguage || user?.targetLanguage || 'de';
        const nativeLang = req.query.nativeLanguage || req.body?.nativeLanguage || user?.nativeLanguage || (targetLang === 'en' ? 'mr' : 'en');
        const mode = req.query.mode || req.body?.mode || 'placement';
        const targetUnitNumber = parseInt(req.query.targetUnitNumber || req.body?.targetUnitNumber || '0', 10) || null;

        const questions = buildDiagnosticPlacementQuestions(targetLang, nativeLang);

        return res.status(200).json({
            success: true,
            mode,
            targetLanguage: targetLang,
            nativeLanguage: nativeLang,
            targetUnitNumber,
            totalQuestions: questions.length,
            maxMistakesAllowed: mode === 'jump' ? 3 : null,
            questions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 11b. Evaluate Placement Test & Apply Safe Curriculum Routing (with A1 Section 2 Fallback)
 * Route: POST /api/gamification/placement/evaluate
 */
exports.evaluatePlacement = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            scorePct,
            correctCount,
            totalQuestions = 12,
            mistakesCount = 0,
            placementMode = 'legacy',
            lessonId = null,
            targetLanguage,
            nativeLanguage,
        } = req.body;

        let computedScorePct = 0;
        if (typeof scorePct === 'number' && Number.isFinite(scorePct)) {
            computedScorePct = Math.max(0, Math.min(100, Math.round(scorePct)));
        } else if (typeof correctCount === 'number' && totalQuestions > 0) {
            computedScorePct = Math.max(0, Math.min(100, Math.round((correctCount / totalQuestions) * 100)));
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either scorePct (0-100) or correctCount is required',
            });
        }

        const isSection2Gate = placementMode === 'section2_gate';
        const parsedMistakes = Math.max(
            0,
            Number.isFinite(Number(mistakesCount)) ? Math.round(Number(mistakesCount)) : 0
        );
        const gatePassed = isSection2Gate
            ? (computedScorePct >= PLACEMENT_MIN_SCORE_PCT && parsedMistakes <= PLACEMENT_MAX_MISTAKES)
            : false;

        // Legacy CEFR Mapping Thresholds (preserved for diagnostic quiz / mid-course callers):
        // < 45% -> A1, 45% - 79% -> A2, >= 80% -> B1
        let assignedLevel = 'A1';
        if (!isSection2Gate) {
            if (computedScorePct >= 80) {
                assignedLevel = 'B1';
            } else if (computedScorePct >= 45) {
                assignedLevel = 'A2';
            }
        }

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const tLang = targetLanguage || user.targetLanguage || 'de';
            const nLang = nativeLanguage || user.nativeLanguage || (tLang === 'en' ? 'mr' : 'en');
            user.targetLanguage = tLang;
            user.nativeLanguage = nLang;

            const unlockedSet = new Set(parseUnlockedLevels(user.unlockedLevels));
            unlockedSet.add('A1');
            if (!isSection2Gate) {
                if (assignedLevel === 'A2') {
                    unlockedSet.add('A2');
                } else if (assignedLevel === 'B1') {
                    unlockedSet.add('A2');
                    unlockedSet.add('B1');
                }
            }

            const skipMap = parsePlacementSkipMap(user.placementSkipMap);
            const a1CourseId = `${tLang}_${nLang}_a1`.toLowerCase();
            let effectiveLevel = 'A1';
            let isFallback = false;
            let fallbackReason = null;
            let targetSectionNumber = 1;
            let targetSectionTitle = 'Rookie';
            let targetUnitNumber = 1;
            let effectiveSkipNode = 0;

            if (isSection2Gate) {
                const currentFrontier = await computeA1Frontier(user, userId, a1CourseId, transaction);
                if (gatePassed) {
                    const sec2Info = await resolveSection2StartNodeIndex(tLang, nLang, 'A1');
                    assignedLevel = 'SEC 2';
                    effectiveLevel = 'A1';
                    effectiveSkipNode = Math.max(currentFrontier, sec2Info.nodeIndex);
                    isFallback = effectiveSkipNode > 0;
                    fallbackReason = 'Passed Section 2 Gate Lesson (Section 2, Unit 4, Lesson 4).';
                    targetSectionNumber = sec2Info.targetSectionNumber;
                    targetSectionTitle = sec2Info.targetSectionTitle;
                    targetUnitNumber = sec2Info.targetUnitNumber;
                } else {
                    assignedLevel = 'A1';
                    effectiveLevel = 'A1';
                    isFallback = false;
                    effectiveSkipNode = currentFrontier;
                }
                skipMap[a1CourseId] = effectiveSkipNode;
            } else {
                const liveTargetLevelCount = await CurriculumLesson.count({
                    where: {
                        learningLanguage: tLang,
                        nativeLanguage: nLang,
                        level: assignedLevel,
                        isLive: true,
                    },
                    transaction,
                });

                if (assignedLevel === 'A1') {
                    effectiveLevel = 'A1';
                    effectiveSkipNode = await computeA1Frontier(user, userId, a1CourseId, transaction);
                    skipMap[a1CourseId] = effectiveSkipNode;
                } else if (liveTargetLevelCount > 0) {
                    effectiveLevel = assignedLevel;
                    isFallback = false;
                    const targetCourseId = `${tLang}_${nLang}_${assignedLevel}`.toLowerCase();
                    effectiveSkipNode = getEffectiveSkipNodeForCourse(user, targetCourseId);
                    skipMap[targetCourseId] = effectiveSkipNode;

                    const node0 = await UserNodeProgress.findOne({
                        where: { userId, courseId: targetCourseId, nodeIndex: 0 },
                        transaction,
                    });
                    if (!node0) {
                        await UserNodeProgress.create({
                            userId,
                            courseId: targetCourseId,
                            nodeIndex: 0,
                            status: 'available',
                        }, { transaction });
                    }
                } else {
                    effectiveLevel = 'A1';
                    isFallback = true;
                    fallbackReason = `${assignedLevel} curriculum is being prepared; fast-tracked to A1 Section 2 (Explorer).`;

                    const sec2Info = await resolveSection2StartNodeIndex(tLang, nLang, 'A1');
                    const currentFrontier = await computeA1Frontier(user, userId, a1CourseId, transaction);
                    effectiveSkipNode = Math.max(currentFrontier, sec2Info.nodeIndex);
                    skipMap[a1CourseId] = effectiveSkipNode;
                    targetSectionNumber = sec2Info.targetSectionNumber;
                    targetSectionTitle = sec2Info.targetSectionTitle;
                    targetUnitNumber = sec2Info.targetUnitNumber;
                }
            }

            user.currentLevel = effectiveLevel;
            user.placementCompleted = true;
            user.placementLevel = assignedLevel;
            user.placementSkipToNode = effectiveSkipNode;
            user.placementSkipMap = JSON.stringify(skipMap);
            user.placementTestDate = new Date();
            user.unlockedLevels = JSON.stringify(Array.from(unlockedSet));

            // Protect / increment daily streak (0 XP and 0 Pearls awarded to prevent leaderboard farming)
            const todayYMD = new Date().toISOString().split('T')[0];
            applyDailyStreakUpdate(user, todayYMD);
            await user.save({ transaction });

            await UserActivity.create({
                userId,
                activityType: 'quiz',
                resourceId: Number.isInteger(Number(lessonId)) ? Number(lessonId) : 0,
                resourceTitle: isSection2Gate
                    ? `Section 2 Gate (${gatePassed ? 'Passed' : 'Section 1'})`
                    : `Diagnostic Placement (${assignedLevel})`,
                subjectName: 'Placement Test',
                topicName: `${tLang.toUpperCase()} Placement`,
                activityDate: todayYMD,
                metadata: {
                    isPlacementTest: true,
                    placementMode,
                    passed: isSection2Gate ? gatePassed : (assignedLevel !== 'A1'),
                    mistakesCount: parsedMistakes,
                    lessonId,
                    scorePct: computedScorePct,
                    assignedLevel,
                    effectiveLevel,
                    isFallback,
                    placementSkipToNode: effectiveSkipNode,
                    targetUnitNumber,
                    xpEarned: 0,
                    pearlsEarned: 0,
                },
            }, { transaction });

            const responseMessage = isSection2Gate
                ? (gatePassed
                    ? `Section 2 unlocked! Fast-tracked to A1 Section 2 (${targetSectionTitle}, Unit ${targetUnitNumber}).`
                    : 'Placement complete! Starting at Section 1, Unit 1 to build strong fundamentals.')
                : (isFallback
                    ? `You tested into ${assignedLevel}! Fast-tracking you to A1 Section 2 (${targetSectionTitle}, Unit ${targetUnitNumber}).`
                    : `Placement complete! Starting at ${effectiveLevel}.`);

            const isAcceleratedStatus = isSection2Gate
                ? (effectiveSkipNode > 0 && gatePassed)
                : isFallback;

            return {
                status: 200,
                body: {
                    success: true,
                    passed: isSection2Gate ? gatePassed : (assignedLevel !== 'A1'),
                    message: responseMessage,
                    placement: {
                        placementMode,
                        passed: isSection2Gate ? gatePassed : (assignedLevel !== 'A1'),
                        scorePct: computedScorePct,
                        mistakesCount: parsedMistakes,
                        minScorePct: PLACEMENT_MIN_SCORE_PCT,
                        maxMistakes: PLACEMENT_MAX_MISTAKES,
                        assignedLevel,
                        effectiveLevel,
                        isFallback,
                        fallbackReason,
                        targetSectionNumber,
                        targetSectionTitle,
                        targetUnitNumber,
                        placementSkipToNode: effectiveSkipNode,
                        unlockedLevels: Array.from(unlockedSet),
                        xpEarned: 0,
                        pearlsEarned: 0,
                        streakCount: user.streakCount,
                    },
                    status: {
                        streakCount: user.streakCount,
                        longestStreak: user.longestStreak,
                        lastActiveDate: user.lastActiveDate,
                        targetLanguage: user.targetLanguage,
                        nativeLanguage: user.nativeLanguage,
                        currentLevel: user.currentLevel,
                        placementCompleted: true,
                        placementLevel: user.placementLevel,
                        placementSkipToNode: effectiveSkipNode,
                        unlockedLevels: Array.from(unlockedSet),
                        isAcceleratedFallback: isAcceleratedStatus,
                        totalXp: user.totalXp || 0,
                        pearls: user.pearls ?? 100,
                        oxygen: user.oxygen ?? 5,
                    },
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};

/**
 * 11c. Mid-Course Section / Unit Jump Gate ("JUMP HERE?")
 * Route: POST /api/gamification/jump-section
 * Body: { targetUnitNumber, scorePct, mistakesCount }
 */
exports.jumpSection = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            targetSectionNumber,
            targetUnitNumber,
            scorePct = 0,
            mistakesCount = 0,
            targetLanguage,
            nativeLanguage,
            level,
        } = req.body;

        const parsedSection = targetSectionNumber !== undefined && targetSectionNumber !== null
            ? parseInt(targetSectionNumber, 10)
            : null;
        const parsedUnit = parseInt(targetUnitNumber, 10);
        const isFirstCourseUnit = (!parsedSection || parsedSection <= 1) && parsedUnit < 2;
        if (!Number.isInteger(parsedUnit) || parsedUnit < 1 || isFirstCourseUnit) {
            return res.status(400).json({
                success: false,
                message: 'targetUnitNumber must be an integer >= 2 (or >= 1 for Section 2+)',
            });
        }

        const passed = scorePct >= 80 && mistakesCount <= 3;
        if (!passed) {
            return res.status(200).json({
                success: true,
                passed: false,
                scorePct,
                mistakesCount,
                message: 'You need at least 80% accuracy and no more than 3 mistakes to jump to this unit.',
            });
        }

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

            const tLang = targetLanguage || user.targetLanguage || 'de';
            const nLang = nativeLanguage || user.nativeLanguage || (tLang === 'en' ? 'mr' : 'en');
            const cLevel = level || user.currentLevel || 'A1';
            const courseId = `${tLang}_${nLang}_${cLevel}`.toLowerCase();

            // Resolve global nodeIndex for (targetSectionNumber, targetUnitNumber)
            const allLessons = await CurriculumLesson.findAll({
                where: {
                    isLive: true,
                    learningLanguage: tLang,
                    nativeLanguage: nLang,
                    level: cLevel,
                },
                attributes: ['id', 'sectionNumber', 'unitNumber', 'lessonIndex'],
                order: [
                    ['sectionNumber', 'ASC'],
                    ['unitNumber', 'ASC'],
                    ['lessonIndex', 'ASC'],
                    ['id', 'ASC'],
                ],
                raw: true,
                transaction,
            });

            let targetNodeIndex = parsedUnit - 1;
            if (Array.isArray(allLessons) && allLessons.length > 0) {
                let foundIdx = -1;
                if (parsedSection && parsedSection >= 1) {
                    foundIdx = allLessons.findIndex(l => {
                        const lSec = l.sectionNumber || 1;
                        const lUnit = l.unitNumber || 1;
                        return lSec > parsedSection || (lSec === parsedSection && lUnit >= parsedUnit);
                    });
                } else {
                    foundIdx = allLessons.findIndex(l => (l.unitNumber || 1) >= parsedUnit);
                }
                if (foundIdx !== -1) {
                    targetNodeIndex = foundIdx;
                } else {
                    targetNodeIndex = allLessons.length - 1;
                }
            }

            const skipMap = parsePlacementSkipMap(user.placementSkipMap);
            const existingSkip = getEffectiveSkipNodeForCourse(user, courseId);
            const newSkipNode = Math.max(existingSkip, targetNodeIndex);

            skipMap[courseId] = newSkipNode;
            user.placementSkipToNode = newSkipNode;
            user.placementSkipMap = JSON.stringify(skipMap);

            const todayYMD = new Date().toISOString().split('T')[0];
            applyDailyStreakUpdate(user, todayYMD);
            await user.save({ transaction });

            return {
                status: 200,
                body: {
                    success: true,
                    passed: true,
                    message: parsedSection
                        ? `Successfully jumped to Section ${parsedSection} • Unit ${parsedUnit}!`
                        : `Successfully jumped to Unit ${parsedUnit}!`,
                    targetSectionNumber: parsedSection || 1,
                    targetUnitNumber: parsedUnit,
                    unlockedNodeIndex: newSkipNode,
                    xpEarned: 0,
                    pearlsEarned: 0,
                    streakCount: user.streakCount,
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        next(error);
    }
};
