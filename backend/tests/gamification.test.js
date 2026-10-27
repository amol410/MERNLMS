const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { createTestUser } = require('./setup');

describe('Gamification & In-Game Economy API Tests', () => {
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
                    scorePct: 100,
                    xpEarned: 12,
                    pearlsEarned: 1,
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
                    scorePct: 75,
                    xpEarned: 10,
                    pearlsEarned: 0,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(100);
            expect(res.body.totalXp).toBe(10);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.pearls).toBe(100);
            expect(updatedUser.totalXp).toBe(10);
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

    describe('POST /api/gamification/claim-ad-reward', () => {
        it('grants +2 oxygen bubbles (capped at 5)', async () => {
            const { user, token } = await createTestUser({
                oxygen: 2,
            });

            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    rewardType: 'oxygen',
                    amount: 2,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(4);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(4);
        });

        it('grants +25 pearls', async () => {
            const { user, token } = await createTestUser({
                pearls: 100,
            });

            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    rewardType: 'pearls',
                    amount: 25,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pearls).toBe(125);

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.pearls).toBe(125);
        });

        it('rejects invalid rewardType', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .post('/api/gamification/claim-ad-reward')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    rewardType: 'unlimited_gold',
                    amount: 100,
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
