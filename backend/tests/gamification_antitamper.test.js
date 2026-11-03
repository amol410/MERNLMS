const { createTestUser, sequelize } = require('./setup');
const gamificationController = require('../controllers/gamificationController');
const User = require('../models/User');
const UserQuest = require('../models/UserQuest');
const UserActivity = require('../models/UserActivity');
const RewardTransaction = require('../models/RewardTransaction');
const UserNodeProgress = require('../models/UserNodeProgress');

/**
 * In-memory controller invocation helper.
 * Executes express controller logic with Sequelize models directly in-memory,
 * avoiding sandboxed TCP socket connect EPERM restrictions.
 */
const callController = async (controllerFn, { user, body = {}, query = {}, headers = {}, params = {} } = {}) => {
    return new Promise(async (resolve, reject) => {
        const req = {
            user,
            body,
            query,
            params,
            headers: { ...headers },
            get(name) {
                const lower = name.toLowerCase();
                for (const key of Object.keys(this.headers)) {
                    if (key.toLowerCase() === lower) return this.headers[key];
                }
                return undefined;
            },
        };

        let statusCode = 200;
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(payload) {
                resolve({ status: statusCode, body: payload });
                return this;
            },
            send(payload) {
                resolve({ status: statusCode, body: payload });
                return this;
            },
        };

        try {
            await controllerFn(req, res, (err) => {
                if (err) reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

describe('Gamification Economy & Anti-Tamper Edge-Case Test Suite', () => {
    const serverToday = new Date().toISOString().split('T')[0];

    beforeEach(async () => {
        await UserNodeProgress.destroy({ where: {} });
        await RewardTransaction.destroy({ where: {} });
        await UserQuest.destroy({ where: {} });
        await UserActivity.destroy({ where: {} });
    });

    /* ======================================================================
     * 1. Server-authoritative timestamps vs client device clock manipulation
     * ====================================================================== */
    describe('1. Server-Authoritative Timestamps vs Client Device Clock Manipulation', () => {
        it('rejects client spoofed date (tomorrow) to advance streak on the same calendar day', async () => {
            // User already completed a lesson today under server time
            const { user } = await createTestUser({
                streakCount: 3,
                longestStreak: 3,
                lastActiveDate: serverToday,
                streakFreezeCount: 0,
            });

            // Tomorrow's date string
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Client attempts to cheat by forging client clock to tomorrow
            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `anti_clock_adv_${Date.now()}`,
                    clientDate: tomorrow,
                    activityDate: tomorrow,
                },
                headers: {
                    'x-client-date': tomorrow,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify streak did NOT increment again on the same real calendar day
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.streakCount).toBe(3);
            expect(refreshed.lastActiveDate).toBe(serverToday);
        });

        it('rejects client spoofed date (yesterday) to bypass streak reset after missing days', async () => {
            // User was last active 3 days ago and has 0 streak freezes
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { user } = await createTestUser({
                streakCount: 15,
                longestStreak: 15,
                lastActiveDate: threeDaysAgo,
                streakFreezeCount: 0,
            });

            // Malicious client pretends lesson was done yesterday (diffDays would be 1 from lastActiveDate)
            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `anti_clock_bypass_${Date.now()}`,
                    clientDate: yesterday,
                    activityDate: yesterday,
                },
                headers: {
                    'x-client-date': yesterday,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Server-authoritative check uses real UTC date, detects 3 days elapsed, and resets streak to 1
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.streakCount).toBe(1);
            expect(refreshed.streakFreezeCount).toBe(0);
            expect(refreshed.lastActiveDate).toBe(serverToday);
        });

        it('progresses server-authoritative UTC today quests even when client submits forged timestamps', async () => {
            const { user } = await createTestUser();

            // Seed today's quests using getQuests
            const questRes = await callController(gamificationController.getQuests, { user });
            expect(questRes.status).toBe(200);
            expect(questRes.body.quests.length).toBe(3);

            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Submitting lesson with tomorrow header
            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `quest_anticheat_${Date.now()}`,
                    clientDate: tomorrow,
                },
                headers: {
                    'x-client-date': tomorrow,
                },
            });
            expect(res.status).toBe(200);

            // Verify quests for serverToday were progressed
            const updatedQuests = await UserQuest.findAll({
                where: { userId: user.id, questDate: serverToday },
            });
            expect(updatedQuests.length).toBe(3);

            const xpQuest = updatedQuests.find(q => q.questType === 'xp');
            expect(xpQuest.currentAmount).toBe(12);

            // Verify no phantom quests were created for tomorrow or yesterday
            const tomorrowQuests = await UserQuest.findAll({
                where: { userId: user.id, questDate: tomorrow },
            });
            expect(tomorrowQuests.length).toBe(0);

            const yesterdayQuests = await UserQuest.findAll({
                where: { userId: user.id, questDate: yesterday },
            });
            expect(yesterdayQuests.length).toBe(0);
        });

        it('persists UserActivity with server-authoritative UTC date and ignores client-forged createdAt', async () => {
            const { user } = await createTestUser();
            const forgedCreatedAt = '2019-01-01T00:00:00.000Z';
            const forgedActivityDate = '2019-01-01';

            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `activity_anticheat_${Date.now()}`,
                    createdAt: forgedCreatedAt,
                    activityDate: forgedActivityDate,
                },
            });

            expect(res.status).toBe(200);

            const activity = await UserActivity.findOne({
                where: { userId: user.id },
            });
            expect(activity).not.toBeNull();
            // activityDate is strictly server UTC date
            expect(activity.activityDate).toBe(serverToday);

            // createdAt is managed by MySQL/Sequelize CURRENT_TIMESTAMP (recent time, not 2019)
            const activityTimeMs = new Date(activity.createdAt).getTime();
            const nowMs = Date.now();
            expect(Math.abs(nowMs - activityTimeMs)).toBeLessThan(10000);
        });
    });

    /* ======================================================================
     * 2. Streak Freeze zero-balance boundary
     * ====================================================================== */
    describe('2. Streak Freeze Zero-Balance Boundary', () => {
        it('resets streak to 1 and keeps freezes at 0 (never negative) when user has 0 freezes and misses days', async () => {
            const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user } = await createTestUser({
                streakCount: 20,
                longestStreak: 20,
                lastActiveDate: fourDaysAgo,
                streakFreezeCount: 0,
            });

            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `freeze_zero_${Date.now()}`,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.streakCount).toBe(1);
            expect(res.body.streakFreezeCount).toBe(0);

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.streakCount).toBe(1);
            expect(refreshed.streakFreezeCount).toBe(0);
            expect(refreshed.streakFreezeCount).toBeGreaterThanOrEqual(0);
        });

        it('handles null or undefined streakFreezeCount gracefully and clamps to 0 without going negative', async () => {
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user } = await createTestUser({
                streakCount: 10,
                longestStreak: 10,
                lastActiveDate: fiveDaysAgo,
                streakFreezeCount: null,
            });

            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `freeze_null_${Date.now()}`,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.streakCount).toBe(1);
            expect(res.body.streakFreezeCount).toBe(0);

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.streakCount).toBe(1);
            expect(refreshed.streakFreezeCount).toBe(0);
        });

        it('consumes exactly 1 freeze when user has 1 freeze, preserving streak; subsequent missed day resets streak and freezes stay 0', async () => {
            // Day 1: User has 1 freeze and missed days
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user } = await createTestUser({
                streakCount: 7,
                longestStreak: 7,
                lastActiveDate: twoDaysAgo,
                streakFreezeCount: 1,
            });

            // 1st completion: freeze used, streak preserved
            const res1 = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `freeze_preserve_${Date.now()}`,
                },
            });
            expect(res1.status).toBe(200);
            expect(res1.body.streakCount).toBe(7);
            expect(res1.body.streakFreezeCount).toBe(0);

            let refreshed = await User.findByPk(user.id);
            expect(refreshed.streakCount).toBe(7);
            expect(refreshed.streakFreezeCount).toBe(0);

            // Simulate missing another day with 0 freezes left
            refreshed.lastActiveDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await refreshed.save();

            // 2nd completion: 0 freezes available -> streak breaks to 1, freezes remain 0
            const res2 = await callController(gamificationController.completeNode, {
                user: refreshed,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `freeze_exhausted_${Date.now()}`,
                },
            });
            expect(res2.status).toBe(200);
            expect(res2.body.streakCount).toBe(1);
            expect(res2.body.streakFreezeCount).toBe(0);

            const finalUser = await User.findByPk(user.id);
            expect(finalUser.streakCount).toBe(1);
            expect(finalUser.streakFreezeCount).toBe(0);
        });
    });

    /* ======================================================================
     * 3. Double XP potion expiration mid-lesson
     * ====================================================================== */
    describe('3. Double XP Potion Expiration Mid-Lesson', () => {
        it('awards base XP (no double multiplier) when potion expired mid-lesson before completion', async () => {
            // Potion expired 15 seconds ago while the student was answering questions
            const expiredFifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
            const { user } = await createTestUser({
                totalXp: 100,
                doubleXpExpiresAt: expiredFifteenSecondsAgo,
            });

            // Client attempts to claim double XP was active when lesson was started
            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `mid_lesson_expired_${Date.now()}`,
                    isDoubleXpActive: true,
                    xpEarned: 24,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.isDoubleXpActive).toBe(false);
            // Base reward for node 0 with 100% score is 12 XP
            expect(res.body.xpEarned).toBe(12);
            expect(res.body.totalXp).toBe(112); // 100 + 12

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(112);
        });

        it('awards double XP when potion was still active at the time of completion', async () => {
            // Potion active for another 10 minutes
            const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);
            const { user } = await createTestUser({
                totalXp: 100,
                doubleXpExpiresAt: futureExpiry,
            });

            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `double_xp_valid_${Date.now()}`,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.isDoubleXpActive).toBe(true);
            // 12 base * 2 = 24 XP
            expect(res.body.xpEarned).toBe(24);
            expect(res.body.totalXp).toBe(124); // 100 + 24

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(124);
        });

        it('boundary test: potion expiring in exact millisecond of completion is treated deterministically as expired', async () => {
            // Exactly in past by 1 millisecond
            const pastExpiry = new Date(Date.now() - 1);
            const { user } = await createTestUser({
                totalXp: 50,
                doubleXpExpiresAt: pastExpiry,
            });

            const res = await callController(gamificationController.completeNode, {
                user,
                body: {
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `boundary_exp_${Date.now()}`,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body.isDoubleXpActive).toBe(false);
            expect(res.body.xpEarned).toBe(12);
            expect(res.body.totalXp).toBe(62); // 50 + 12
        });

        it('preserves double XP receipt on idempotent replay even if potion has expired by the replay time', async () => {
            const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);
            const { user } = await createTestUser({
                totalXp: 0,
                doubleXpExpiresAt: futureExpiry,
            });

            const attemptId = `replay_double_${Date.now()}`;

            // First call: completed with active double XP
            const first = await callController(gamificationController.completeNode, {
                user,
                body: { nodeIndex: 0, scorePct: 100, attemptId },
            });
            expect(first.body.xpEarned).toBe(24);
            expect(first.body.totalXp).toBe(24);

            // Now expire the user's potion
            user.doubleXpExpiresAt = new Date(Date.now() - 60 * 1000);
            await user.save();

            // Replay the exact same attemptId
            const replay = await callController(gamificationController.completeNode, {
                user,
                body: { nodeIndex: 0, scorePct: 100, attemptId },
            });

            expect(replay.status).toBe(200);
            expect(replay.body.idempotentReplay).toBe(true);
            expect(replay.body.xpEarned).toBe(24);
            expect(replay.body.totalXp).toBe(24);

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(24);
        });
    });

    /* ======================================================================
     * 4. Weekly League promotion and demotion tie-breakers
     * ====================================================================== */
    describe('4. Weekly League Promotion and Demotion Tie-Breakers', () => {
        it('deterministically sorts students with identical weekly XP using stable ID tie-breaker so rankings never flicker', async () => {
            const league = 'Coral Reef';

            // Create 4 users with identical weekly XP (350 XP) and identical streaks
            const { user: userA } = await createTestUser({
                name: 'Student Alpha',
                totalXp: 350,
                streakCount: 5,
                currentLeague: league,
            });
            const { user: userB } = await createTestUser({
                name: 'Student Beta',
                totalXp: 350,
                streakCount: 5,
                currentLeague: league,
            });
            const { user: userC } = await createTestUser({
                name: 'Student Gamma',
                totalXp: 350,
                streakCount: 5,
                currentLeague: league,
            });
            const { user: userD } = await createTestUser({
                name: 'Student Delta',
                totalXp: 350,
                streakCount: 5,
                currentLeague: league,
            });

            // Call getLeaderboard multiple times
            const res1 = await callController(gamificationController.getLeaderboard, {
                user: userA,
                query: { league },
            });
            const res2 = await callController(gamificationController.getLeaderboard, {
                user: userB,
                query: { league },
            });
            const res3 = await callController(gamificationController.getLeaderboard, {
                user: userC,
                query: { league },
            });

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);
            expect(res3.status).toBe(200);

            // Extract ranks for the 4 tied users
            const getOrder = (res) => res.body.leaderboard
                .filter(u => [userA.id, userB.id, userC.id, userD.id].includes(u.id))
                .map(u => ({ id: u.id, rank: u.rank }));

            const order1 = getOrder(res1);
            const order2 = getOrder(res2);
            const order3 = getOrder(res3);

            // The order across all 3 independent calls must be 100% identical (no ranking flicker)
            expect(order1).toEqual(order2);
            expect(order2).toEqual(order3);

            // Stable ID tie-breaker asserts ascending user ID order when XP and streaks are equal
            const sortedIds = [userA.id, userB.id, userC.id, userD.id].sort((a, b) => a - b);
            expect(order1.map(o => o.id)).toEqual(sortedIds);
        });

        it('ranks earlier achievement timestamp ahead when two students finish with identical weekly XP', async () => {
            const league = 'Coral Reef';

            const { user: earlyUser } = await createTestUser({
                name: 'Early Bird',
                totalXp: 500,
                streakCount: 3,
                currentLeague: league,
            });
            const { user: lateUser } = await createTestUser({
                name: 'Late Finisher',
                totalXp: 500,
                streakCount: 3,
                currentLeague: league,
            });

            // Reward transactions since Monday
            const monday = new Date();
            monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
            monday.setUTCHours(0, 0, 0, 0);

            // Early bird reached 350 XP at 09:00
            const earlyTimestamp = new Date(monday.getTime() + 9 * 60 * 60 * 1000);
            await RewardTransaction.create({
                userId: earlyUser.id,
                kind: 'lesson',
                reference: `tx_early_${Date.now()}`,
                xpEarned: 350,
                createdAt: earlyTimestamp,
                responseBody: {},
            });

            // Late finisher reached 350 XP at 18:00
            const lateTimestamp = new Date(monday.getTime() + 18 * 60 * 60 * 1000);
            await RewardTransaction.create({
                userId: lateUser.id,
                kind: 'lesson',
                reference: `tx_late_${Date.now()}`,
                xpEarned: 350,
                createdAt: lateTimestamp,
                responseBody: {},
            });

            const res = await callController(gamificationController.getLeaderboard, {
                user: earlyUser,
                query: { league },
            });

            expect(res.status).toBe(200);

            const lb = res.body.leaderboard;
            const earlyRank = lb.find(u => u.id === earlyUser.id)?.rank;
            const lateRank = lb.find(u => u.id === lateUser.id)?.rank;

            expect(earlyRank).toBeDefined();
            expect(lateRank).toBeDefined();
            // Early bird reached 350 XP earlier, so earlyRank is higher (lower numerical rank number)
            expect(earlyRank).toBeLessThan(lateRank);
        });

        it('consistently assigns promotion, safe, and demotion tier zones without boundary oscillation', async () => {
            const league = 'Coral Reef';
            const timestamp = Date.now();
            const dummyHash = '$2a$10$wT0X70a5/tOqW2K0n6pYve0mD30k9K5q0s9u2p1e0mD30k9K5q0s9';

            // Seed 30 users in the league with descending scores using bulkCreate for instant execution
            const userRecords = [];
            for (let i = 1; i <= 30; i++) {
                userRecords.push({
                    name: `Cohort Student ${i}`,
                    email: `cohort_${i}_${timestamp}_${Math.random().toString(36).substring(2, 7)}@test.com`,
                    password: dummyHash,
                    isEmailVerified: true,
                    role: 'student',
                    totalXp: 300 - i * 5,
                    currentLeague: league,
                    streakCount: 1,
                    isActive: true,
                });
            }
            const users = await User.bulkCreate(userRecords);

            const res = await callController(gamificationController.getLeaderboard, {
                user: users[0],
                query: { league },
            });

            expect(res.status).toBe(200);
            expect(res.body.leaderboard.length).toBe(30);

            for (const entry of res.body.leaderboard) {
                if (entry.rank <= 10) {
                    expect(entry.tierZone).toBe('promotion');
                } else if (entry.rank <= 25) {
                    expect(entry.tierZone).toBe('safe');
                } else {
                    expect(entry.tierZone).toBe('demotion');
                }
            }

            // Top 10 is promotion zone, bottom 5 (ranks 26-30) is demotion zone
            const promoCount = res.body.leaderboard.filter(e => e.tierZone === 'promotion').length;
            const safeCount = res.body.leaderboard.filter(e => e.tierZone === 'safe').length;
            const demoteCount = res.body.leaderboard.filter(e => e.tierZone === 'demotion').length;

            expect(promoCount).toBe(10);
            expect(safeCount).toBe(15);
            expect(demoteCount).toBe(5);
        });
    });
});
