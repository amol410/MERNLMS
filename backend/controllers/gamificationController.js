const User = require('../models/User');
const UserNodeProgress = require('../models/UserNodeProgress');
const UserQuest = require('../models/UserQuest');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const CurriculumLesson = require('../models/CurriculumLesson');
const { getTodayLocalYMD } = require('../utils/dateHelper');

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

// 2. Get Archipelago Map Nodes with User Progression
exports.getPath = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const progressList = await UserNodeProgress.findAll({ where: { userId } });
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

        // 7-Node Island Archipelago (Fallback)
        const defaultNodes = [
            {
                index: 0,
                title: 'Basics & Greetings',
                subtitle: 'Essential German greetings & etiquette',
                type: 'lesson',
                xpReward: 15,
                sourceType: 'note',
                sourceId: sampleNote ? sampleNote.id : null,
                offset: 0.0,
            },
            {
                index: 1,
                title: 'Audio Karaoke Rhythm',
                subtitle: 'Word-by-word synced listening',
                type: 'karaoke',
                xpReward: 20,
                sourceType: 'note',
                sourceId: sampleNote ? sampleNote.id : null,
                offset: 45.0,
            },
            {
                index: 2,
                title: 'Sprechen Lip-Sync',
                subtitle: 'Voice dictation & pronunciation',
                type: 'speech',
                xpReward: 25,
                sourceType: 'note',
                sourceId: sampleNote ? sampleNote.id : null,
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
                subtitle: 'Rapid vocabulary tile match',
                type: 'match',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuiz ? sampleQuiz.id : null,
                offset: -45.0,
            },
            {
                index: 5,
                title: 'Sentence Architect',
                subtitle: 'Grammar structure puzzle',
                type: 'builder',
                xpReward: 20,
                sourceType: 'quiz',
                sourceId: sampleQuiz ? sampleQuiz.id : null,
                offset: 35.0,
            },
            {
                index: 6,
                title: 'Coral Reef Exam',
                subtitle: 'Mastery challenge to promote',
                type: 'boss',
                xpReward: 35,
                sourceType: 'quiz',
                sourceId: sampleQuiz ? sampleQuiz.id : null,
                offset: 0.0,
            },
        ];

        // Fetch live published lessons created by admin/trainers for this language/level
        const liveCurriculum = await CurriculumLesson.findAll({
            where: {
                isLive: true,
                learningLanguage: req.user.targetLanguage || 'de',
                level: req.user.currentLevel || 'A1',
            },
            order: [
                ['unitNumber', 'ASC'],
                ['lessonIndex', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        const zigzagOffsets = [0.0, 45.0, -40.0, 20.0, -45.0, 35.0, 0.0, -35.0, 40.0];

        let targetNodesList = defaultNodes;
        if (liveCurriculum && liveCurriculum.length > 0) {
            targetNodesList = liveCurriculum.map((l, idx) => ({
                id: l.id,
                index: idx,
                title: l.title,
                subtitle: l.subtitle || '',
                type: l.nodeType || 'lesson',
                xpReward: l.xpReward || 15,
                pearlsReward: l.pearlsReward || (l.nodeType === 'chest' ? 30 : 5),
                sourceType: l.nodeType === 'karaoke' ? 'note' : 'lesson',
                sourceId: l.sourceNoteId || l.id,
                stages: l.stages,
                audioUrl: l.audioUrl,
                offset: zigzagOffsets[idx % zigzagOffsets.length],
            }));
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

        // Upsert node progress
        let progress = await UserNodeProgress.findOne({ where: { userId, nodeIndex } });
        if (!progress) {
            progress = await UserNodeProgress.create({
                userId,
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

        // Auto unlock next node
        const nextNodeIndex = parseInt(nodeIndex, 10) + 1;
        let nextProg = await UserNodeProgress.findOne({ where: { userId, nodeIndex: nextNodeIndex } });
        if (!nextProg) {
            await UserNodeProgress.create({
                userId,
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

        const todayYMD = getTodayLocalYMD(req.headers['x-timezone-offset']);
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
        const todayYMD = getTodayLocalYMD(req.headers['x-timezone-offset']);

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
