const { Op } = require('sequelize');
const User = require('../models/User');
const UserNodeProgress = require('../models/UserNodeProgress');
const UserQuest = require('../models/UserQuest');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const CurriculumLesson = require('../models/CurriculumLesson');
const { getTodayLocalYMD, getClientDate } = require('../utils/dateHelper');

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

        res.status(200).json({
            success: true,
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

        // Fetch latest published Karaoke Note and Quiz to bind real content
        const sampleNote = await Note.findOne({
            where: { contentType: 'karaoke' },
            order: [['createdAt', 'DESC']],
        });
        const sampleQuiz = await Quiz.findOne({
            order: [['createdAt', 'DESC']],
        });

        // Localized Fallback Nodes for this language
        const defaultNodes = getDefaultNodesForCourse(
            targetLang,
            sampleNote ? sampleNote.id : null,
            sampleQuiz ? sampleQuiz.id : null
        );

        // Section & Unit pagination support
        const whereClause = {
            isLive: true,
            learningLanguage: targetLang,
            nativeLanguage: nativeLang,
            level: level,
        };

        const section = req.query.section ? parseInt(req.query.section) : null;
        const unit = req.query.unit ? parseInt(req.query.unit) : null;
        if (unit) {
            whereClause.unitNumber = unit;
        } else if (section) {
            const startUnit = (section - 1) * 35 + 1;
            const endUnit = section * 35;
            whereClause.unitNumber = { [Op.between]: [startUnit, endUnit] };
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
            ],
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        const zigzagOffsets = [0.0, 45.0, -40.0, 20.0, -45.0, 35.0, 0.0, -35.0, 40.0];

        const unitColors = ['#1CB0F6', '#58CC02', '#FF9600', '#CE82FF', '#FF4B4B', '#00CD9C', '#FFC800'];

        let targetNodesList = defaultNodes;
        if (liveCurriculum && liveCurriculum.length > 0) {
            targetNodesList = liveCurriculum.map((l, idx) => {
                const uNum = l.unitNumber || 1;
                const secNum = uNum <= 35 ? 1 : (uNum <= 70 ? 2 : 3);
                const secTitle = secNum === 1 ? 'Rookie' : (secNum === 2 ? 'Explorer' : 'Traveler');
                const secUnitNum = secNum === 1 ? uNum : (secNum === 2 ? uNum - 35 : uNum - 70);
                const colorHex = unitColors[(uNum - 1) % unitColors.length];

                return {
                    id: l.id,
                    index: idx,
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
                    offset: zigzagOffsets[idx % zigzagOffsets.length],
                };
            });
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

// 3. Complete a node, award XP/pearls, update streak, unlock next node
exports.completeNode = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { nodeIndex, stars = 3, scorePct = 100, xpEarned = 20, pearlsEarned = 10 } = req.body;

        if (nodeIndex === undefined) {
            return res.status(400).json({ success: false, message: 'nodeIndex is required' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Resolve courseId from body or user defaults
        const targetLang = req.body.learningLanguage || req.body.targetLanguage || user.targetLanguage || 'de';
        let nativeLang = req.body.nativeLanguage || user.nativeLanguage;
        if (!nativeLang) {
            nativeLang = (targetLang === 'en') ? 'mr' : 'en';
        }
        const level = req.body.level || user.currentLevel || 'A1';
        const courseId = (req.body.courseId || `${targetLang}_${nativeLang}_${level}`).toLowerCase();

        // Upsert node progress scoped to courseId
        let progress = await UserNodeProgress.findOne({ where: { userId, courseId, nodeIndex } });
        if (!progress) {
            progress = await UserNodeProgress.create({
                userId,
                courseId,
                nodeIndex,
                status: 'completed',
                stars: Math.max(1, Math.min(3, stars)),
                scorePct,
                completedAt: new Date(),
            });
        } else {
            progress.status = 'completed';
            progress.stars = Math.max(progress.stars, stars);
            progress.scorePct = Math.max(progress.scorePct, scorePct);
            progress.completedAt = new Date();
            await progress.save();
        }

        // Auto unlock next node for this specific course
        const nextNodeIndex = parseInt(nodeIndex, 10) + 1;
        let nextProg = await UserNodeProgress.findOne({ where: { userId, courseId, nodeIndex: nextNodeIndex } });
        if (!nextProg) {
            await UserNodeProgress.create({
                userId,
                courseId,
                nodeIndex: nextNodeIndex,
                status: 'available',
            });
        } else if (nextProg.status === 'locked') {
            nextProg.status = 'available';
            await nextProg.save();
        }

        // Streak & XP Calculation
        user.totalXp = (user.totalXp || 0) + parseInt(xpEarned, 10);
        user.pearls = (user.pearls || 0) + parseInt(pearlsEarned, 10);

        const todayYMD = getClientDate(req) || getTodayLocalYMD(req.headers['x-timezone-offset']);
        if (!user.lastActiveDate) {
            user.streakCount = 1;
            user.lastActiveDate = todayYMD;
        } else {
            const lastDate = new Date(user.lastActiveDate);
            const todayDate = new Date(todayYMD);
            const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                user.streakCount = (user.streakCount || 0) + 1;
                user.lastActiveDate = todayYMD;
            } else if (diffDays > 1) {
                user.streakCount = 1;
                user.lastActiveDate = todayYMD;
            }
            // diffDays === 0 means already active today, streak doesn't increment multiple times on same day
        }

        user.longestStreak = Math.max(user.longestStreak || 1, user.streakCount);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Node completed successfully',
            xpEarned,
            pearlsEarned,
            streakCount: user.streakCount,
            totalXp: user.totalXp,
            pearls: user.pearls,
            oxygen: user.oxygen,
            unlockedNextIndex: nextNodeIndex,
        });
    } catch (error) {
        next(error);
    }
};

// 4. Leaderboard by League
exports.getLeaderboard = async (req, res, next) => {
    try {
        const league = req.query.league || req.user.currentLeague || 'Coral Reef';
        const topUsers = await User.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'avatar', 'totalXp', 'currentLeague', 'streakCount'],
            order: [['totalXp', 'DESC']],
            limit: 30,
        });

        const formatted = topUsers.map((u, idx) => ({
            rank: idx + 1,
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            xp: u.totalXp || 0,
            streak: u.streakCount || 1,
            isCurrent: u.id === req.user.id,
            league: u.currentLeague || 'Coral Reef',
        }));

        res.status(200).json({ success: true, league, leaderboard: formatted });
    } catch (error) {
        next(error);
    }
};

// 5. Refill Oxygen via Shop (Cost: 50 Pearls)
exports.refillOxygen = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.oxygen >= 5) {
            return res.status(400).json({ success: false, message: 'Oxygen is already full' });
        }

        const cost = 50;
        if ((user.pearls || 0) < cost) {
            return res.status(400).json({ success: false, message: 'Not enough pearls (50 required)' });
        }

        user.pearls -= cost;
        user.oxygen = 5;
        user.lastOxygenRefill = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Oxygen fully restored!',
            oxygen: user.oxygen,
            pearls: user.pearls,
        });
    } catch (error) {
        next(error);
    }
};

// 6. Get Daily Quests (Auto-seed if not yet created for today)
exports.getQuests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const todayYMD = getClientDate(req) || getTodayLocalYMD(req.headers['x-timezone-offset']);

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
                stages: lesson.stages,
                karaokeData: lesson.karaokeData,
                audioUrl: lesson.audioUrl,
                sourceNoteId: lesson.sourceNoteId,
            }
        });
    } catch (error) {
        next(error);
    }
};
