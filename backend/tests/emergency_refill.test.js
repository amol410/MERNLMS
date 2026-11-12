const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { createTestUser } = require('./setup');

describe('Emergency oxygen refill (no ads available)', () => {
    it('rejects the refill while the learner still has oxygen', async () => {
        const { token, user } = await createTestUser({});
        await User.update({ oxygen: 2 }, { where: { id: user.id } });

        const res = await request(app)
            .post('/api/gamification/emergency-refill')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('grants +1 oxygen at 0 oxygen, then enforces the cooldown', async () => {
        const { token, user } = await createTestUser({});
        await User.update({ oxygen: 0 }, { where: { id: user.id } });

        const first = await request(app)
            .post('/api/gamification/emergency-refill')
            .set('Authorization', `Bearer ${token}`);
        expect(first.status).toBe(200);
        expect(first.body.oxygen).toBe(1);

        // Learner burns the bubble again and tries to borrow a second time inside the window
        await User.update({ oxygen: 0 }, { where: { id: user.id } });
        const second = await request(app)
            .post('/api/gamification/emergency-refill')
            .set('Authorization', `Bearer ${token}`);
        expect(second.status).toBe(429);
        expect(second.body.retryAfterSec).toBeGreaterThan(0);

        const reloaded = await User.findByPk(user.id);
        expect(reloaded.oxygen).toBe(0);
        expect(await RewardTransaction.count({ where: { userId: user.id, kind: 'emergency_refill' } })).toBe(1);
    });
});
