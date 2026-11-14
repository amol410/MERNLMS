const request = require('supertest');
jest.mock('../utils/adMobVerifier', () => ({ verifyAdMobQuery: jest.fn() }));
const app = require('../server');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { verifyAdMobQuery } = require('../utils/adMobVerifier');
const { createTestUser } = require('./setup');

describe('Gamification & In-Game Economy API Tests', () => {
    beforeEach(() => {
        verifyAdMobQuery.mockReset();
        verifyAdMobQuery.mockResolvedValue(true);
    });
    describe('GET /api/gamification/status', () => {
        it('returns user gamification status', async () => {
            const { user, token } = await createTestUser({
                oxygen: 4,
                pearls: 80,
                lastOxygenRefill: new Date(),
            });

            const res = await request(app)
                .get('/api/gamification/status')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(4);
            expect(res.body.pearls).toBe(80);
            expect(res.body.status).toBeDefined();
            expect(res.body.status.oxygen).toBe(4);
            expect(res.body.status.pearls).toBe(80);
        });

        it('auto-refills 1 oxygen per 30 minutes elapsed', async () => {
            const sixtyFiveMinutesAgo = new Date(Date.now() - 65 * 60 * 1000);
            const { user, token } = await createTestUser({
                oxygen: 2,
                lastOxygenRefill: sixtyFiveMinutesAgo,
            });

            const res = await request(app)
                .get('/api/gamification/status')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // 2 initial + 2 refilled (65m / 30m = 2) = 4 bubbles
            expect(res.body.oxygen).toBe(4);
            expect(res.body.status.oxygen).toBe(4);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(4);
        });
    });

    describe('POST /api/gamification/complete-node', () => {
        it('awards 1 Pearl and 12 XP for 100% accuracy', async () => {
            const { user, token } = await createTestUser({
                pearls: 100,
                totalXp: 0,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    attemptId: 'lesson-perfect-001',
                    scorePct: 100,
                    stars: 1,
                    xpEarned: 99999,
                    pearlsEarned: 99999,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(101);
            expect(res.body.totalXp).toBe(12);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.pearls).toBe(101);
            expect(updatedUser.totalXp).toBe(12);
        });

        it('awards 0 Pearls for < 100% accuracy', async () => {
            const { user, token } = await createTestUser({
                pearls: 100,
                totalXp: 0,
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    attemptId: 'lesson-partial-001',
                    scorePct: 75,
                    xpEarned: 99999,
                    pearlsEarned: 99999,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(100);
            expect(res.body.totalXp).toBe(10);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.pearls).toBe(100);
            expect(updatedUser.totalXp).toBe(10);
        });

        it('rejects missing attempt IDs and invalid scores', async () => {
            const { token } = await createTestUser();

            const missingAttempt = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({ nodeIndex: 0, scorePct: 100 });
            expect(missingAttempt.status).toBe(400);

            const invalidScore = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({ nodeIndex: 0, attemptId: 'lesson-invalid-001', scorePct: 101 });
            expect(invalidScore.status).toBe(400);
        });

        it('returns the original receipt without awarding a replayed attempt twice', async () => {
            const { user, token } = await createTestUser({ pearls: 100, totalXp: 0 });
            const payload = {
                nodeIndex: 0,
                attemptId: 'lesson-replay-001',
                scorePct: 100,
            };

            const first = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);
            const replay = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(first.status).toBe(200);
            expect(replay.status).toBe(200);
            expect(replay.body.idempotentReplay).toBe(true);
            expect(replay.body.totalXp).toBe(first.body.totalXp);
            expect(replay.body.pearls).toBe(first.body.pearls);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.totalXp).toBe(12);
            expect(updatedUser.pearls).toBe(101);
            expect(await RewardTransaction.count({ where: { userId: user.id, kind: 'lesson' } })).toBe(1);
        });
    });

    describe('POST /api/gamification/refill-oxygen', () => {
        it('deducts 50 pearls and restores oxygen to 5', async () => {
            const { user, token } = await createTestUser({
                oxygen: 2,
                pearls: 100,
            });

            const res = await request(app)
                .post('/api/gamification/refill-oxygen')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(5);
            expect(res.body.pearls).toBe(50);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(5);
            expect(updatedUser.pearls).toBe(50);
        });

        it('fails if user has less than 50 pearls', async () => {
            const { user, token } = await createTestUser({
                oxygen: 2,
                pearls: 30,
            });

            const res = await request(app)
                .post('/api/gamification/refill-oxygen')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Not enough pearls/i);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(2);
            expect(updatedUser.pearls).toBe(30);
        });
    });

    describe('Rewarded ad verification', () => {
        it('credits server-authoritative fixed reward and ignores client inflation amounts', async () => {
            const { user, token } = await createTestUser({ pearls: 100, oxygen: 0 });

            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'oxygen', amount: 99999 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(3);
            expect((await User.findByPk(user.id)).oxygen).toBe(3);
        });

        it('rejects an invalid AdMob signature', async () => {
            verifyAdMobQuery.mockResolvedValue(false);
            const { user } = await createTestUser({ pearls: 100 });

            const res = await request(app)
                .get('/api/gamification/admob/ssv')
                .query({
                    user_id: user.id,
                    transaction_id: 'admob-invalid-001',
                    timestamp: Math.floor(Date.now() / 1000),
                    custom_data: JSON.stringify({ rewardType: 'pearls' }),
                    signature: 'invalid',
                    key_id: '1',
                });

            expect(res.status).toBe(400);
            expect((await User.findByPk(user.id)).pearls).toBe(100);
        });

        it('credits a verified pearl reward once across callback retries', async () => {
            const { user } = await createTestUser({ pearls: 100 });
            const query = {
                user_id: user.id,
                transaction_id: 'admob-pearls-001',
                timestamp: Math.floor(Date.now() / 1000),
                custom_data: JSON.stringify({ rewardType: 'pearls' }),
                reward_amount: 99999,
                signature: 'valid',
                key_id: '1',
            };

            const first = await request(app).get('/api/gamification/admob/ssv').query(query);
            const replay = await request(app).get('/api/gamification/admob/ssv').query(query);

            expect(first.status).toBe(200);
            expect(first.body.pearlsEarned).toBe(50);
            expect(replay.body.idempotentReplay).toBe(true);
            expect((await User.findByPk(user.id)).pearls).toBe(150);
        });

        it('doubles XP from the server lesson receipt instead of a client amount', async () => {
            const { user, token } = await createTestUser({ totalXp: 0 });
            await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({ nodeIndex: 0, attemptId: 'lesson-double-001', scorePct: 100 });

            const res = await request(app)
                .get('/api/gamification/admob/ssv')
                .query({
                    user_id: user.id,
                    transaction_id: 'admob-double-001',
                    timestamp: Math.floor(Date.now() / 1000),
                    custom_data: JSON.stringify({ rewardType: 'double_xp', attemptId: 'lesson-double-001' }),
                    reward_amount: 99999,
                    signature: 'valid',
                    key_id: '1',
                });

            expect(res.status).toBe(200);
            expect(res.body.xpEarned).toBe(12);
            expect((await User.findByPk(user.id)).totalXp).toBe(24);
        });
    });

    describe('complete-node course contract', () => {
        it('echoes the active course track so the client can reconcile language', async () => {
            const { token } = await createTestUser({
                targetLanguage: 'en',
                nativeLanguage: 'hi',
                currentLevel: 'A1',
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    attemptId: 'lesson-course-echo-001',
                    scorePct: 100,
                    targetLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // Previously omitted, which forced the client to guess the course.
            expect(res.body.targetLanguage).toBe('en');
            expect(res.body.nativeLanguage).toBe('hi');
            expect(res.body.currentLevel).toBe('A1');
        });

        it('reports the course actually used, not the client-supplied one', async () => {
            const { token } = await createTestUser({
                targetLanguage: 'en',
                nativeLanguage: 'hi',
                currentLevel: 'A1',
            });

            const res = await request(app)
                .post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    nodeIndex: 0,
                    attemptId: 'lesson-course-authoritative-001',
                    scorePct: 100,
                    targetLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                });

            expect(res.status).toBe(200);
            expect(res.body.targetLanguage).toBe('en');
            expect(res.body.nativeLanguage).toBe('hi');
            // Must never silently resolve to Marathi/English defaults.
            expect(res.body.nativeLanguage).not.toBe('mr');
        });
    });
});
