const request = require('supertest');
const app = require('../server');
const { createTestUser } = require('./setup');
const User = require('../models/User');
const { invalidateUserCache } = require('../middleware/auth');

describe('Auth In-Memory Session Cache Suite (DB-02)', () => {
    let studentToken;
    let studentUser;

    beforeAll(async () => {
        const student = await createTestUser();
        studentToken = student.token;
        studentUser = student.user;
    });

    beforeEach(() => {
        invalidateUserCache();
    });

    it('1. Retrieves user from database on first call and caches session in memory', async () => {
        const findSpy = jest.spyOn(User, 'findByPk');

        const res1 = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res1.status).toBe(200);
        expect(res1.body.success).toBe(true);
        expect(findSpy).toHaveBeenCalledTimes(1);

        // Second immediate call should hit cache without calling User.findByPk
        const res2 = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res2.status).toBe(200);
        expect(res2.body.success).toBe(true);
        expect(findSpy).toHaveBeenCalledTimes(1); // Still 1! Cache hit!

        findSpy.mockRestore();
    });

    it('2. Invalidating cache forces database lookup on subsequent call', async () => {
        const findSpy = jest.spyOn(User, 'findByPk');

        // Prime cache
        await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(findSpy).toHaveBeenCalledTimes(1);

        // Invalidate cache for this user
        invalidateUserCache(studentUser.id);

        // Call again -> should query database
        await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(findSpy).toHaveBeenCalledTimes(2);

        findSpy.mockRestore();
    });
});
