const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { createTestUser, createTestAdmin } = require('./setup');

describe('Authentication, Security & RBAC Test Suite', () => {
    describe('Registration & Password Security', () => {
        it('POST /api/auth/register - successfully registers student with hashed password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Alice',
                    email: 'alice@test.com',
                    password: 'Password123!',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user).toBeDefined();
            expect(res.body.user.role).toBe('student');

            const dbUser = await User.findOne({ where: { email: 'alice@test.com' } });
            expect(dbUser).not.toBeNull();
            expect(dbUser.password).not.toBe('Password123!');
            expect(dbUser.password).toMatch(/^\$2[aby]\$\d{2}\$/);
        });

        it('POST /api/auth/register - rejects duplicate email registration', async () => {
            const firstRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Bob',
                    email: 'bob@test.com',
                    password: 'Password123!',
                });
            expect(firstRes.status).toBe(201);

            const dupRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Bob Duplicate',
                    email: 'bob@test.com',
                    password: 'Password123!',
                });

            expect(dupRes.status).toBe(400);
            expect(dupRes.body.success).toBe(false);
            expect(dupRes.body.message).toMatch(/already exists/i);
        });
    });

    describe('Login & Authentication', () => {
        it('POST /api/auth/login - logs in with valid credentials', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Charlie',
                    email: 'charlie@test.com',
                    password: 'SecretPassword123!',
                });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'charlie@test.com',
                    password: 'SecretPassword123!',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('POST /api/auth/login - rejects incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'charlie@test.com',
                    password: 'WrongPassword!',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Authorization Middleware', () => {
        it('Authorization Middleware - rejects protected route without token', async () => {
            const res = await request(app)
                .get('/api/gamification/status');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Role-Based Access Control', () => {
        it('Role-Based Access Control - student blocked from admin routes', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('Role-Based Access Control - admin allowed on admin routes', async () => {
            const { token } = await createTestAdmin();

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
