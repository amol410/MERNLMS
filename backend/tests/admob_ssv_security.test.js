const request = require('supertest');
jest.mock('../utils/adMobVerifier', () => ({ verifyAdMobQuery: jest.fn() }));
const app = require('../server');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { verifyAdMobQuery } = require('../utils/adMobVerifier');
const { createTestUser } = require('./setup');

describe('SEC-07: Rewarded Ad Security & Anti-Bypass Suite', () => {
    beforeEach(() => {
        verifyAdMobQuery.mockReset();
        verifyAdMobQuery.mockResolvedValue(true);
        delete process.env.REQUIRE_ADMOB_SSV;
    });

    afterAll(() => {
        delete process.env.REQUIRE_ADMOB_SSV;
    });

    describe('Anti-Bot Cooldown Protection on Client Claims', () => {
        it('blocks rapid back-to-back ad claims within 35 seconds with 429', async () => {
            const { user, token } = await createTestUser({ pearls: 50, oxygen: 1 });

            // 1st legitimate claim (simulating completed 30s ad)
            const first = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'pearls' });

            expect(first.status).toBe(200);
            expect(first.body.success).toBe(true);
            expect(first.body.pearlsEarned).toBe(25);

            // Immediate 2nd claim (bot loop / curl exploit attempt)
            const second = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'pearls' });

            expect(second.status).toBe(429);
            expect(second.body.success).toBe(false);
            expect(second.body.message).toMatch(/Please wait \d+s for the ad to complete/i);

            // Verify user pearls only incremented once (50 + 25 = 75, not 100)
            const dbUser = await User.findByPk(user.id);
            expect(dbUser.pearls).toBe(75);
        });

        it('allows subsequent claim after the 35s cooldown window has elapsed', async () => {
            const { user, token } = await createTestUser({ pearls: 50, oxygen: 2 });

            // Manually insert an ad transaction that completed 40 seconds ago
            const fortySecondsAgo = new Date(Date.now() - 40 * 1000);
            await RewardTransaction.create({
                userId: user.id,
                kind: 'client_ad',
                reference: 'prior-ad-tx',
                pearlsEarned: 25,
                responseBody: { success: true },
                createdAt: fortySecondsAgo,
                updatedAt: fortySecondsAgo,
            });

            // Subsequent claim now succeeds because cooldown has elapsed
            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'oxygen' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygenEarned).toBe(3);
        });
    });

    describe('Daily Limit Cap (6/6 Ads)', () => {
        it('strictly caps total daily rewarded ads at 6', async () => {
            const { user, token } = await createTestUser({ pearls: 50 });

            // Create 6 prior ad transactions for today
            const todayStart = new Date();
            todayStart.setUTCHours(1, 0, 0, 0);

            for (let i = 1; i <= 6; i++) {
                await RewardTransaction.create({
                    userId: user.id,
                    kind: 'client_ad',
                    reference: `daily-tx-${i}`,
                    pearlsEarned: 25,
                    responseBody: { success: true },
                    createdAt: todayStart,
                    updatedAt: todayStart,
                });
            }

            // 7th claim exceeds daily quota -> 429
            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'pearls' });

            expect(res.status).toBe(429);
            expect(res.body.message).toMatch(/Daily rewarded ad limit reached/i);
        });
    });

    describe('AdMob SSV Reconciliation & Zero Double-Dipping', () => {
        it('reconciles client claim with verified AdMob SSV receipt without double crediting', async () => {
            const { user, token } = await createTestUser({ pearls: 100, oxygen: 1 });

            // 1. Google AdMob servers deliver cryptographic SSV callback to backend
            const ssvRes = await request(app)
                .get('/api/gamification/admob/ssv')
                .query({
                    user_id: user.id,
                    transaction_id: 'google-admob-ssv-tx-101',
                    timestamp: Math.floor(Date.now() / 1000),
                    custom_data: JSON.stringify({ rewardType: 'pearls' }),
                    signature: 'valid_signature',
                    key_id: '1',
                });

            expect(ssvRes.status).toBe(200);
            expect(ssvRes.body.pearlsEarned).toBe(25);

            // User now has 125 pearls from the SSV callback
            let dbUser = await User.findByPk(user.id);
            expect(dbUser.pearls).toBe(125);

            // 2. Mobile app onUserEarnedReward fires and calls claim-ad-reward
            const clientRes = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'pearls' });

            expect(clientRes.status).toBe(200);
            expect(clientRes.body.verifiedByAdMob).toBe(true);
            expect(clientRes.body.pearls).toBe(125);

            // Verify user pearls remain 125 (NOT double credited to 150!)
            dbUser = await User.findByPk(user.id);
            expect(dbUser.pearls).toBe(125);
        });
    });

    describe('Strict SSV Mode (REQUIRE_ADMOB_SSV=true)', () => {
        it('rejects unverified client claims when strict mode is active', async () => {
            process.env.REQUIRE_ADMOB_SSV = 'true';
            const { user, token } = await createTestUser({ pearls: 100 });

            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({ rewardType: 'pearls' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/must be verified via AdMob SSV/i);
        });
    });
});
