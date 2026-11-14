const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { createTestUser } = require('./setup');

const complete = (token, nodeIndex, scorePct, attemptId) =>
    request(app)
        .post('/api/gamification/complete-node')
        .set('Authorization', `Bearer ${token}`)
        .send({ nodeIndex, scorePct, attemptId });

describe('Replay pearls (review bonus)', () => {
    it('gives no replay bonus on the first completion of a lesson', async () => {
        const { token } = await createTestUser({ pearls: 100 });
        const res = await complete(token, 1, 90, 'replay-first-0001');
        expect(res.status).toBe(200);
        expect(res.body.replayPearlsEarned).toBe(0);
        expect(res.body.pearls).toBe(100);
    });

    it('gives +5 pearls on a replay with >=80% accuracy, to users with any balance', async () => {
        const { user, token } = await createTestUser({ pearls: 500 });
        await complete(token, 2, 100, 'replay-a-0001');
        const replay = await complete(token, 2, 85, 'replay-a-0002');
        expect(replay.body.replayPearlsEarned).toBe(5);
        expect(replay.body.pearlsEarned).toBe(5);
        expect((await User.findByPk(user.id)).pearls).toBe(501 + 5);
    });

    it('does not pay for replays below 80% accuracy', async () => {
        const { token } = await createTestUser({ pearls: 100 });
        await complete(token, 3, 100, 'replay-b-0001');
        const replay = await complete(token, 3, 79, 'replay-b-0002');
        expect(replay.body.replayPearlsEarned).toBe(0);
    });

    it('pays once per lesson per day', async () => {
        const { user, token } = await createTestUser({ pearls: 100 });
        await complete(token, 4, 90, 'replay-c-0001');
        const first = await complete(token, 4, 90, 'replay-c-0002');
        const second = await complete(token, 4, 90, 'replay-c-0003');
        expect(first.body.replayPearlsEarned).toBe(5);
        expect(second.body.replayPearlsEarned).toBe(0);
        expect(await RewardTransaction.count({ where: { userId: user.id, kind: 'replay_pearls' } })).toBe(1);
    });

    it('caps replay pearls at 50 per day across lessons', async () => {
        const { user, token } = await createTestUser({ pearls: 100 });
        // 48 pearls already paid today for other lessons -> only 2 left under the 50 cap
        await RewardTransaction.create({
            userId: user.id,
            kind: 'replay_pearls',
            reference: 'seed:earlier-today',
            pearlsEarned: 48,
            responseBody: {},
        });

        await complete(token, 0, 90, 'replay-d-first-0');
        await complete(token, 1, 90, 'replay-d-first-1');
        const a = await complete(token, 0, 90, 'replay-d-again-0');
        const b = await complete(token, 1, 90, 'replay-d-again-1');

        expect(a.body.replayPearlsEarned).toBe(2);
        expect(b.body.replayPearlsEarned).toBe(0);
        const paid = await RewardTransaction.sum('pearlsEarned', { where: { userId: user.id, kind: 'replay_pearls' } });
        expect(paid).toBe(50);
    });

    it('does not double pay when the same attempt is retried (idempotent)', async () => {
        const { user, token } = await createTestUser({ pearls: 100 });
        await complete(token, 5, 90, 'replay-e-0001');
        await complete(token, 5, 90, 'replay-e-0002');
        const retry = await complete(token, 5, 90, 'replay-e-0002');
        expect(retry.body.idempotentReplay).toBe(true);
        expect(await RewardTransaction.count({ where: { userId: user.id, kind: 'replay_pearls' } })).toBe(1);
    });
});

describe('Replay pearls rollout control', () => {
    afterEach(() => {
        delete process.env.REPLAY_PEARLS_ROLLOUT_PERCENT;
    });

    it('pays nothing and reports disabled when the user is outside the rollout share', async () => {
        const { user, token } = await createTestUser({ pearls: 100 });
        // Choose a rollout percent that excludes this user's id bucket (user.id % 100 >= percent)
        process.env.REPLAY_PEARLS_ROLLOUT_PERCENT = String(user.id % 100);

        const status = await request(app)
            .get('/api/gamification/status')
            .set('Authorization', `Bearer ${token}`);
        expect(status.body.status.replayPearlsEnabled).toBe(false);

        await complete(token, 6, 90, 'rollout-0001');
        const replay = await complete(token, 6, 90, 'rollout-0002');
        expect(replay.body.replayPearlsEarned).toBe(0);
    });

    it('reports enabled by default (100%)', async () => {
        const { token } = await createTestUser({});
        const status = await request(app)
            .get('/api/gamification/status')
            .set('Authorization', `Bearer ${token}`);
        expect(status.body.status.replayPearlsEnabled).toBe(true);
    });
});
