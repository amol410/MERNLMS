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
                targetLanguage: user.targetLanguage || 'de',
                nativeLanguage: user.nativeLanguage || (user.targetLanguage === 'en' ? 'mr' : 'en'),
                currentLevel: user.currentLevel || 'A1',
                pearls: user.pearls ?? 100,
                oxygen: user.oxygen ?? 5,
                totalXp: user.totalXp || 0,
                currentLeague: user.currentLeague || 'Coral Reef',
                streakFreezeCount: user.streakFreezeCount || 0,
                isDoubleXpActive,
                doubleXpExpiresAt: user.doubleXpExpiresAt,
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
        const targetLang = req.query.learningLanguage || req.query.targetLanguage || req.user.targetLanguage || 'de';
        let nativeLang = req.query.nativeLanguage || req.user.nativeLanguage;
        if (!nativeLang) {
            nativeLang = (targetLang === 'en') ? 'mr' : 'en';
        }
        const level = req.query.level || req.user.currentLevel || 'A1';
        const courseId = `${targetLang}_${nativeLang}_${level}`.toLowerCase();

        // Query user progress strictly scoped to this course
        const progressList = await UserNodeProgress.findAll({
            where: {
                userId,
                courseId,
            },
        });
        const progressMap = {};
        progressList.forEach(p => {
            progressMap[p.nodeIndex] = p;
        });

        // Section & Unit pagination support (with windowing lookahead)
        const whereClause = {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level: level,
        };

        const section = req.query.section ? parseInt(req.query.section) : null;
        const unit = req.query.unit ? parseInt(req.query.unit) : null;
        const startUnit = req.query.startUnit ? parseInt(req.query.startUnit) : null;
        const endUnit = req.query.endUnit ? parseInt(req.query.endUnit) : null;

        if (startUnit && endUnit) {
            whereClause.unitNumber = { [Op.between]: [startUnit, endUnit] };
        } else if (unit) {
            whereClause.unitNumber = unit;
        } else if (section) {
            const secStartUnit = (section - 1) * 35 + 1;
            const secEndUnit = section * 35;
            whereClause.unitNumber = { [Op.between]: [secStartUnit, secEndUnit] };
        }

        // Query all live lesson IDs for this course to preserve global node.index under windowing
        const allCourseLessons = await CurriculumLesson.findAll({
            where: {
                isLive: true,
                learningLanguage: targetLang,
                nativeLanguage: nativeLang,
                level: level,
            },
            attributes: ['id'],
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
            raw: true,
        });
        const globalIndexMap = new Map();
        if (Array.isArray(allCourseLessons)) {
            allCourseLessons.forEach((lesson, idx) => {
                if (lesson && lesson.id !== undefined) {
                    globalIndexMap.set(lesson.id, idx);
                }
            });
        }

        // Fetch live published lessons created by admin/trainers for this language/level
        // CRITICAL PERFORMANCE: Only select map navigation attributes. Omit heavy `stages` & `karaokeData`!
        const liveCurriculum = await CurriculumLesson.findAll({
            where: whereClause,
            attributes: [
                'id',
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
                const uNum = l.unitNumber || 1;
                const secNum = uNum <= 35 ? 1 : (uNum <= 70 ? 2 : 3);
                const secTitle = secNum === 1 ? 'Rookie' : (secNum === 2 ? 'Explorer' : 'Traveler');
                const secUnitNum = secNum === 1 ? uNum : (secNum === 2 ? uNum - 35 : uNum - 70);
                const colorHex = unitColors[(uNum - 1) % unitColors.length];

                return {
                    id: l.id,
                    index: globalIdx,
                    unitNumber: uNum,
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

        // Enrich nodes with user completion status
        const nodes = targetNodesList.map(node => {
            const prog = progressMap[node.index];
            let status = 'locked';
            if (node.index === 0) {
                status = prog ? prog.status : 'available';
            } else {
                // If previous node completed, this is at least available
                const prev = progressMap[node.index - 1];
                if (prev && prev.status === 'completed') {
                    status = prog ? prog.status : 'available';
                } else {
                    status = prog ? prog.status : 'locked';
                }
            }

            return {
                ...node,
                stages: null,
                status: status,
                stars: prog ? prog.stars : 0,
                scorePct: prog ? prog.scorePct : 0,
            };
        });

        res.status(200).json({ success: true, nodes });
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
        order: [['unitNumber', 'ASC'], ['lessonIndex', 'ASC'], ['id', 'ASC']],
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
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Course track updated successfully',
            status: {
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage,
                currentLevel: user.currentLevel || 'A1',
            }
        });
    } catch (error) {
        next(error);
    }
};

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
            lesson: {
                id: lesson.id,
                unitNumber: lesson.unitNumber,
                unitTitle: lesson.unitTitle,
                unitDescription: lesson.unitDescription,
                lessonIndex: lesson.lessonIndex,
                title: lesson.title,
                subtitle: lesson.subtitle,
                nodeType: lesson.nodeType,
                xpReward: lesson.xpReward,
                pearlsReward: lesson.pearlsReward,
                stages: sanitizeLessonStages(lesson.stages),
                karaokeData: lesson.karaokeData,
                audioUrl: lesson.audioUrl,
                sourceNoteId: lesson.sourceNoteId,
                updatedAt: lesson.updatedAt ? (typeof lesson.updatedAt.toISOString === 'function' ? lesson.updatedAt.toISOString() : String(lesson.updatedAt)) : null,
            }
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

        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!user) return { status: 404, body: { success: false, message: 'User not found' } };

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
                where: { userId, kind: 'admob', createdAt: { [Op.gte]: todayStart } },
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
                user.oxygen = Math.min(5, previousOxygen + 2);
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
                xpEarned,
                pearlsEarned,
                oxygenEarned,
                oxygen: user.oxygen,
                pearls: user.pearls,
                totalXp: user.totalXp,
                idempotentReplay: false,
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
