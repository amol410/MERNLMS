const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const UserQuest = require('../models/UserQuest');
const { createTestUser, sequelize } = require('./setup');
const { getClientDate } = require('../utils/dateHelper');

describe('Phase 2 Economy & Gamification Test Suite', () => {

    /* ======================================================================
     * 1. Shop: Buy Streak Freeze
     * ====================================================================== */
    describe('POST /api/gamification/shop/buy-streak-freeze', () => {
        it('requires authentication (returns 401 when unauthenticated)', async () => {
            const res = await request(app)
                .post('/api/gamification/shop/buy-streak-freeze')
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects purchase if user has fewer than 100 pearls', async () => {
            const { user, token } = await createTestUser({ pearls: 50, streakFreezeCount: 0 });

            const res = await request(app)
                .post('/api/gamification/shop/buy-streak-freeze')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not enough pearls/i);

            // Confirm database remained unchanged
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.pearls).toBe(50);
            expect(refreshed.streakFreezeCount).toBe(0);
        });

        it('successfully deducts 100 pearls and increments streakFreezeCount', async () => {
            const { user, token } = await createTestUser({ pearls: 150, streakFreezeCount: 1 });

            const res = await request(app)
                .post('/api/gamification/shop/buy-streak-freeze')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(50);
            expect(res.body.streakFreezeCount).toBe(2);

            // Confirm DB persistence
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.pearls).toBe(50);
            expect(refreshed.streakFreezeCount).toBe(2);
        });
    });

    /* ======================================================================
     * 2. Shop: Buy Double XP Potion
     * ====================================================================== */
    describe('POST /api/gamification/shop/buy-double-xp', () => {
        it('requires authentication (returns 401 when unauthenticated)', async () => {
            const res = await request(app)
                .post('/api/gamification/shop/buy-double-xp')
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects purchase if user has fewer than 150 pearls', async () => {
            const { user, token } = await createTestUser({ pearls: 120 });

            const res = await request(app)
                .post('/api/gamification/shop/buy-double-xp')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not enough pearls/i);
        });

        it('successfully deducts 150 pearls, sets doubleXpExpiresAt to +30min, and flags isDoubleXpActive', async () => {
            const { user, token } = await createTestUser({ pearls: 200, doubleXpExpiresAt: null });

            const beforeCall = Date.now();
            const res = await request(app)
                .post('/api/gamification/shop/buy-double-xp')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(50);
            expect(res.body.isDoubleXpActive).toBe(true);
            expect(res.body.doubleXpExpiresAt).toBeDefined();

            const expiryMs = new Date(res.body.doubleXpExpiresAt).getTime();
            const expectedMs = beforeCall + 30 * 60 * 1000;
            // Expiry should be within 5 seconds of expected 30m window
            expect(Math.abs(expiryMs - expectedMs)).toBeLessThan(5000);

            // Verify in database
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.pearls).toBe(50);
            expect(new Date(refreshed.doubleXpExpiresAt).getTime()).toBe(expiryMs);
        });
    });

    /* ======================================================================
     * 3. Streak Freeze Protection in completeNode
     * ====================================================================== */
    describe('completeNode Streak Freeze Preservation', () => {
        it('preserves streak and decrements freeze count when user misses a day (diffDays > 1) with active freeze', async () => {
            // User had streak 5, but last active 3 days ago, and has 1 freeze
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user, token } = await createTestUser({
                streakCount: 5,
                longestStreak: 5,
                lastActiveDate: threeDaysAgo,
                streakFreezeCount: 1,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `freeze_protect_${Date.now()}`,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const refreshed = await User.findByPk(user.id);
            // Freeze was consumed
            expect(refreshed.streakFreezeCount).toBe(0);
            // Streak was preserved at 5, NOT reset to 1!
            expect(refreshed.streakCount).toBe(5);
        });

        it('resets streak to 1 when user misses a day (diffDays > 1) with 0 streak freezes', async () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const { user, token } = await createTestUser({
                streakCount: 7,
                longestStreak: 7,
                lastActiveDate: threeDaysAgo,
                streakFreezeCount: 0,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `streak_reset_${Date.now()}`,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const refreshed = await User.findByPk(user.id);
            // Streak reset to 1
            expect(refreshed.streakCount).toBe(1);
            expect(refreshed.streakFreezeCount).toBe(0);
        });
    });

    /* ======================================================================
     * 4. Double XP Multiplier in completeNode
     * ====================================================================== */
    describe('completeNode Double XP Multiplier', () => {
        it('doubles XP earned when doubleXpExpiresAt is in the future', async () => {
            const futureExpiry = new Date(Date.now() + 25 * 60 * 1000); // 25 min in future
            const { user, token } = await createTestUser({
                totalXp: 100,
                doubleXpExpiresAt: futureExpiry,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `double_xp_active_${Date.now()}`,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Base reward for node 0 with 100% score is 12 XP (10 + 2).
            // With Double XP active, user should gain 24 XP (100 -> 124).
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(124);
        });

        it('awards regular XP when doubleXpExpiresAt has already expired', async () => {
            const pastExpiry = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
            const { user, token } = await createTestUser({
                totalXp: 100,
                doubleXpExpiresAt: pastExpiry,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `double_xp_expired_${Date.now()}`,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Base reward is 12 XP. Total XP should be 100 + 12 = 112.
            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(112);
        });
    });

    /* ======================================================================
     * 5. Daily Quests Lifecycle & Auto-Progression
     * ====================================================================== */
    describe('Daily Quests Pipeline', () => {
        it('GET /api/gamification/quests auto-seeds 3 active quests for today', async () => {
            const { user, token } = await createTestUser();

            const res = await request(app)
                .get('/api/gamification/quests')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.quests)).toBe(true);
            expect(res.body.quests.length).toBe(3);

            const questTypes = res.body.quests.map(q => q.type);
            expect(questTypes).toContain('xp');
            expect(questTypes).toContain('karaoke');
            expect(questTypes).toContain('speech');

            // Quests initially unclaimed
            for (const q of res.body.quests) {
                expect(q.current).toBe(0);
                expect(q.isClaimed).toBe(false);
                expect(q.isCompleted).toBe(false);
            }
        });

        it('completeNode automatically increments xp and lesson/speech daily quest counters', async () => {
            const { user, token } = await createTestUser();

            // First fetch quests to ensure today is seeded
            const questsRes = await request(app)
                .get('/api/gamification/quests')
                .set('Authorization', `Bearer ${token}`);
            expect(questsRes.status).toBe(200);

            // Complete a node
            const completeRes = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    scorePct: 100,
                    attemptId: `quest_prog_${Date.now()}`,
                });
            expect(completeRes.status).toBe(200);

            // Fetch quests again and check progress
            const updatedQuestsRes = await request(app)
                .get('/api/gamification/quests')
                .set('Authorization', `Bearer ${token}`);

            const xpQuest = updatedQuestsRes.body.quests.find(q => q.type === 'xp');
            const speechQuest = updatedQuestsRes.body.quests.find(q => q.type === 'speech');

            // XP quest should have gained 12 points
            expect(xpQuest.current).toBe(12);
            // Speech quest should have gained 1 count
            expect(speechQuest.current).toBe(1);
            expect(speechQuest.isCompleted).toBe(true); // target was 1
        });

        it('rejects claiming an incomplete quest (returns 400)', async () => {
            const { user, token } = await createTestUser();

            const questsRes = await request(app)
                .get('/api/gamification/quests')
                .set('Authorization', `Bearer ${token}`);

            const incompleteQuest = questsRes.body.quests.find(q => !q.isCompleted);

            const claimRes = await request(app)
                .post('/api/gamification/claim-quest')
                .set('Authorization', `Bearer ${token}`)
                .send({ questId: incompleteQuest.id });

            expect(claimRes.status).toBe(400);
            expect(claimRes.body.success).toBe(false);
            expect(claimRes.body.message).toMatch(/not yet completed/i);
        });

        it('successfully claims a completed quest, credits pearls and XP, and marks as claimed', async () => {
            const { user, token } = await createTestUser({ pearls: 10, totalXp: 50 });

            // Seed quests
            await request(app)
                .get('/api/gamification/quests')
                .set('Authorization', `Bearer ${token}`);

            // Find speech quest and set current to target
            const todayYMD = new Date().toISOString().split('T')[0];
            const quest = await UserQuest.findOne({
                where: { userId: user.id, questType: 'speech' },
            });
            expect(quest).not.toBeNull();
            quest.currentAmount = quest.targetAmount;
            await quest.save();

            // Claim the quest
            const claimRes = await request(app)
                .post('/api/gamification/claim-quest')
                .set('Authorization', `Bearer ${token}`)
                .send({ questId: quest.id });

            expect(claimRes.status).toBe(200);
            expect(claimRes.body.success).toBe(true);
            expect(claimRes.body.pearls).toBe(10 + quest.rewardPearls);
            expect(claimRes.body.totalXp).toBe(50 + quest.rewardXp);

            // Re-claiming the same quest should be rejected with 400
            const reClaimRes = await request(app)
                .post('/api/gamification/claim-quest')
                .set('Authorization', `Bearer ${token}`)
                .send({ questId: quest.id });

            expect(reClaimRes.status).toBe(400);
            expect(reClaimRes.body.message).toMatch(/already claimed/i);
        });
    });
});
