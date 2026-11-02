const request = require('supertest');
const app = require('../server');
const CurriculumLesson = require('../models/CurriculumLesson');
const { createTestUser, createTestAdmin } = require('./setup');

describe('Admin Management, Profile Lifecycle & Multi-Course Track Isolation Suite', () => {
    describe('1. Admin User & Trainer Management (/api/admin)', () => {
        it('creates trainer (isEmailVerified: true, can log in immediately), lists users, updates trainer, toggles student active state (blocking login & /auth/me with 403), and blocks deleting admin', async () => {
            const { user: adminUser, token: adminToken } = await createTestAdmin();
            const { user: studentUser, token: studentToken } = await createTestUser({
                email: 'student_manage@test.com',
                password: 'Password123!',
            });

            // Create trainer
            const createTrainerRes = await request(app)
                .post('/api/admin/trainers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Herr Schmidt',
                    email: 'schmidt@dolphincoder.com',
                    password: 'TrainerPass123!',
                });
            expect(createTrainerRes.status).toBe(201);
            expect(createTrainerRes.body.user.role).toBe('trainer');
            expect(createTrainerRes.body.user.isEmailVerified).toBe(true);
            const trainerId = createTrainerRes.body.user.id || createTrainerRes.body.user._id;

            // Verify admin-created trainer can immediately log in via POST /api/auth/login
            const trainerLoginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'schmidt@dolphincoder.com',
                    password: 'TrainerPass123!',
                });
            expect(trainerLoginRes.status).toBe(200);
            expect(trainerLoginRes.body.token).toBeDefined();
            expect(trainerLoginRes.body.user.role).toBe('trainer');

            // Update trainer
            const updateTrainerRes = await request(app)
                .put(`/api/admin/trainers/${trainerId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Prof. Schmidt',
                    email: 'schmidt@dolphincoder.com',
                });
            expect(updateTrainerRes.status).toBe(200);
            expect(updateTrainerRes.body.user.name).toBe('Prof. Schmidt');

            // List users
            const listRes = await request(app)
                .get('/api/admin/users?page=1')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(listRes.status).toBe(200);
            expect(listRes.body.users.length).toBeGreaterThanOrEqual(3);

            // Toggle student active status -> deactivates student
            const toggleRes = await request(app)
                .put(`/api/admin/users/${studentUser.id}/toggle-active`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(toggleRes.status).toBe(200);
            expect(toggleRes.body.user.isActive).toBe(false);

            // Deactivated user receives 403 when attempting POST /api/auth/login
            const deactivatedLoginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'student_manage@test.com',
                    password: 'Password123!',
                });
            expect(deactivatedLoginRes.status).toBe(403);

            // Deactivated user receives 403 when calling GET /api/auth/me with existing token
            const deactivatedMeRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(deactivatedMeRes.status).toBe(403);

            // Prevent toggling or deleting an admin account
            const toggleAdminRes = await request(app)
                .put(`/api/admin/users/${adminUser.id}/toggle-active`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(toggleAdminRes.status).toBe(403);

            const deleteAdminRes = await request(app)
                .delete(`/api/admin/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(deleteAdminRes.status).toBe(403);
        });
    });

    describe('2. Profile & Password Lifecycle (/api/auth/me, /api/auth/profile, /api/auth/password)', () => {
        it('fetches current user, updates profile bio/name, and changes password with currentPassword check', async () => {
            const { token } = await createTestUser({
                name: 'Initial Name',
                email: 'profile_user@test.com',
                password: 'InitialPass123!',
            });

            // GET /api/auth/me
            const meRes = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            expect(meRes.status).toBe(200);
            expect(meRes.body.user.email).toBe('profile_user@test.com');

            // PUT /api/auth/profile
            const profRes = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Polyglot Explorer', bio: 'Mastering German & English' });
            expect(profRes.status).toBe(200);
            expect(profRes.body.user.name).toBe('Polyglot Explorer');
            expect(profRes.body.user.bio).toBe('Mastering German & English');

            // PUT /api/auth/password with wrong currentPassword -> 400
            const badPassRes = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'WrongPassword', newPassword: 'NewSecurePass123!' });
            expect(badPassRes.status).toBe(400);

            // PUT /api/auth/password with too short newPassword (< 6 chars) -> 400
            const shortPassRes = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'InitialPass123!', newPassword: '123' });
            expect(shortPassRes.status).toBe(400);

            // PUT /api/auth/password with valid currentPassword -> 200
            const goodPassRes = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'InitialPass123!', newPassword: 'NewSecurePass123!' });
            expect(goodPassRes.status).toBe(200);
            expect(goodPassRes.body.token).toBeDefined();
        });
    });

    describe('3. Multi-Language Course Switching & Windowed Archipelago Path (/api/gamification)', () => {
        it('switches between German (de/en), English for Hindi (en/hi), and English for Marathi (en/mr)', async () => {
            const { token } = await createTestUser({ email: 'switcher@test.com' });

            // Switch to English via Hindi
            const hiRes = await request(app)
                .post('/api/gamification/switch-course')
                .set('Authorization', `Bearer ${token}`)
                .send({ targetLanguage: 'en', nativeLanguage: 'hi', level: 'A1' });
            expect(hiRes.status).toBe(200);
            expect(hiRes.body.status.targetLanguage).toBe('en');
            expect(hiRes.body.status.nativeLanguage).toBe('hi');

            // Switch to English via Marathi
            const mrRes = await request(app)
                .post('/api/gamification/switch-course')
                .set('Authorization', `Bearer ${token}`)
                .send({ targetLanguage: 'en', nativeLanguage: 'mr', level: 'A2' });
            expect(mrRes.status).toBe(200);
            expect(mrRes.body.status.targetLanguage).toBe('en');
            expect(mrRes.body.status.nativeLanguage).toBe('mr');
            expect(mrRes.body.status.currentLevel).toBe('A2');
        });

        it('preserves global node.index when querying windowed GET /api/gamification/path?startUnit=2&endUnit=2', async () => {
            await CurriculumLesson.destroy({ where: {} });
            const { user: adminUser } = await createTestAdmin();
            const { token: studentToken } = await createTestUser({
                learningLanguage: 'de',
                nativeLanguage: 'en',
                currentLevel: 'A1',
            });

            // Create a live lesson in Unit 1 (global index 0)
            await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Unit 1 Foundations',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                isLive: true,
            });

            // Create a live lesson in Unit 2 (global index 1)
            const unit2Lesson = await CurriculumLesson.create({
                owner: adminUser.id,
                title: 'Unit 2 Windowed Node',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 2,
                lessonIndex: 0,
                isLive: true,
            });

            const res = await request(app)
                .get('/api/gamification/path?startUnit=2&endUnit=2')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.nodes)).toBe(true);
            expect(res.body.nodes).toHaveLength(1);
            expect(res.body.nodes[0].id).toBe(unit2Lesson.id);
            expect(res.body.nodes[0].title).toBe('Unit 2 Windowed Node');
            // Must preserve global node.index === 1 (NOT reset to 0!)
            expect(res.body.nodes[0].index).toBe(1);
        });
    });
});
