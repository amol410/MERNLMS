const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { createTestUser, createTestAdmin } = require('./setup');

describe('Authentication, Security & RBAC Test Suite', () => {
    describe('Registration & Password Security', () => {
        it('POST /api/auth/register - successfully creates unverified student and issues verification OTP', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Alice',
                    email: 'alice@test.com',
                    password: 'Password123!',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.requireVerification).toBe(true);
            expect(res.body.email).toBe('alice@test.com');
            expect(res.body.message).toMatch(/verification code sent/i);

            const dbUser = await User.findOne({ where: { email: 'alice@test.com' } });
            expect(dbUser).not.toBeNull();
            expect(dbUser.isEmailVerified).toBe(false);
            expect(dbUser.verificationOtp).toHaveLength(6);
            expect(dbUser.password).not.toBe('Password123!');
            expect(dbUser.password).toMatch(/^\$2[aby]\$\d{2}\$/);
        });

        it('POST /api/auth/register - rejects duplicate email registration if already verified', async () => {
            await User.create({
                name: 'Bob',
                email: 'bob@test.com',
                password: 'Password123!',
                role: 'student',
                isEmailVerified: true,
            });

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
        it('POST /api/auth/login - logs in with valid credentials for verified user', async () => {
            await User.create({
                name: 'Charlie',
                email: 'charlie@test.com',
                password: 'SecretPassword123!',
                role: 'student',
                isEmailVerified: true,
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

        it('POST /api/auth/login - blocks unverified user with 403 and auto-resends verification OTP', async () => {
            await User.create({
                name: 'Unverified Dan',
                email: 'dan@test.com',
                password: 'SecretPassword123!',
                role: 'student',
                isEmailVerified: false,
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'dan@test.com',
                    password: 'SecretPassword123!',
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.requireVerification).toBe(true);
            expect(res.body.message).toMatch(/verify your email/i);

            const user = await User.findOne({ where: { email: 'dan@test.com' } });
            expect(user.verificationOtp).toHaveLength(6);
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

    describe('Email Verification OTP Flow (Sign Up / Registration)', () => {
        let regEmail = 'newlearner@test.com';

        beforeEach(async () => {
            await User.destroy({ where: { email: regEmail } });
        });

        it('full registration & verification flow: registers -> verifies OTP -> logs in with token', async () => {
            // 1. Register creates unverified account
            const regRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New Learner',
                    email: regEmail,
                    password: 'StrongPassword123!',
                });

            expect(regRes.status).toBe(201);
            expect(regRes.body.requireVerification).toBe(true);

            const user = await User.findOne({ where: { email: regEmail } });
            const validOtp = user.verificationOtp;
            expect(validOtp).toHaveLength(6);
            expect(user.isEmailVerified).toBe(false);

            // 2. Reject invalid OTP code
            const wrongRes = await request(app)
                .post('/api/auth/verify-registration-otp')
                .send({ email: regEmail, otp: '000000' });
            expect(wrongRes.status).toBe(400);
            expect(wrongRes.body.message).toMatch(/invalid or expired/i);

            // 3. Reject expired OTP code
            user.verificationOtpExpires = new Date(Date.now() - 60000);
            await user.save();
            const expRes = await request(app)
                .post('/api/auth/verify-registration-otp')
                .send({ email: regEmail, otp: validOtp });
            expect(expRes.status).toBe(400);
            expect(expRes.body.message).toMatch(/expired/i);

            // Reset expiration for valid test
            user.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
            await user.save();

            // 4. Verify with valid OTP code -> returns token and marks email verified
            const verifyRes = await request(app)
                .post('/api/auth/verify-registration-otp')
                .send({ email: regEmail, otp: validOtp });

            expect(verifyRes.status).toBe(200);
            expect(verifyRes.body.success).toBe(true);
            expect(verifyRes.body.token).toBeDefined();
            expect(verifyRes.body.user.isEmailVerified).toBe(true);

            // 5. Database state clean
            const verifiedUser = await User.findOne({ where: { email: regEmail } });
            expect(verifiedUser.isEmailVerified).toBe(true);
            expect(verifiedUser.verificationOtp).toBeNull();
            expect(verifiedUser.verificationOtpExpires).toBeNull();

            // 6. Verified user can now log in normally
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: regEmail, password: 'StrongPassword123!' });
            expect(loginRes.status).toBe(200);
            expect(loginRes.body.token).toBeDefined();
        });

        it('POST /api/auth/resend-registration-otp - generates and sends fresh OTP code', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New Learner',
                    email: regEmail,
                    password: 'StrongPassword123!',
                });

            const initialUser = await User.findOne({ where: { email: regEmail } });
            const initialOtp = initialUser.verificationOtp;

            const resendRes = await request(app)
                .post('/api/auth/resend-registration-otp')
                .send({ email: regEmail });

            expect(resendRes.status).toBe(200);
            expect(resendRes.body.success).toBe(true);
            expect(resendRes.body.message).toMatch(/resent successfully/i);

            const updatedUser = await User.findOne({ where: { email: regEmail } });
            expect(updatedUser.verificationOtp).toHaveLength(6);
        });

        it('POST /api/auth/resend-registration-otp - rejects resend for already verified accounts', async () => {
            await User.create({
                name: 'Verified User',
                email: regEmail,
                password: 'Password123!',
                isEmailVerified: true,
                role: 'student',
            });

            const res = await request(app)
                .post('/api/auth/resend-registration-otp')
                .send({ email: regEmail });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already verified/i);
        });

        it('POST /api/auth/register - updates unverified account and sends fresh OTP on re-register', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Initial Name',
                    email: regEmail,
                    password: 'OldPassword123!',
                });

            const reRegRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Updated Name',
                    email: regEmail,
                    password: 'NewPassword123!',
                });

            expect(reRegRes.status).toBe(200);
            expect(reRegRes.body.requireVerification).toBe(true);

            const user = await User.findOne({ where: { email: regEmail } });
            expect(user.name).toBe('Updated Name');
            expect(user.isEmailVerified).toBe(false);
        });
    });

    describe('Forgot Password & OTP Flow (Hostinger SMTP)', () => {
        let testEmail = 'otpuser@test.com';

        beforeEach(async () => {
            await User.destroy({ where: { email: testEmail } });
            await User.create({
                name: 'OTP User',
                email: testEmail,
                password: 'InitialPassword123!',
                isEmailVerified: true,
                role: 'student',
            });
        });

        it('POST /api/auth/forgot-password - generates 6-digit OTP and sets expiration (15 mins)', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/OTP has been sent/i);

            const user = await User.findOne({ where: { email: testEmail } });
            expect(user.resetPasswordOtp).toBeDefined();
            expect(user.resetPasswordOtp).toHaveLength(6);
            expect(/^\d{6}$/.test(user.resetPasswordOtp)).toBe(true);
            expect(user.resetPasswordOtpExpires).toBeDefined();

            // Expiration should be within 15 minutes in future
            const diffMs = new Date(user.resetPasswordOtpExpires).getTime() - Date.now();
            expect(diffMs).toBeGreaterThan(14 * 60 * 1000);
            expect(diffMs).toBeLessThanOrEqual(15 * 60 * 1000 + 5000);
        });

        it('POST /api/auth/forgot-password - returns 404 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@test.com' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/no account found/i);
        });

        it('POST /api/auth/verify-otp - successfully verifies matching 6-digit OTP', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            const user = await User.findOne({ where: { email: testEmail } });
            const validOtp = user.resetPasswordOtp;

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: testEmail, otp: validOtp });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/verified successfully/i);
        });

        it('POST /api/auth/verify-otp - rejects invalid OTP code', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: testEmail, otp: '000000' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid or expired/i);
        });

        it('POST /api/auth/verify-otp - rejects expired OTP', async () => {
            const user = await User.findOne({ where: { email: testEmail } });
            user.resetPasswordOtp = '123456';
            user.resetPasswordOtpExpires = new Date(Date.now() - 60000); // 1 minute in the past
            await user.save();

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: testEmail, otp: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/expired/i);
        });

        it('POST /api/auth/reset-password - resets password with bcrypt 12 rounds and clears OTP fields', async () => {
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            const userBefore = await User.findOne({ where: { email: testEmail } });
            const otp = userBefore.resetPasswordOtp;

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: testEmail,
                    otp,
                    newPassword: 'BrandNewSecurePassword123!',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify in DB that password changed, bcrypt 12 rounds used, and OTP cleared
            const userAfter = await User.findOne({ where: { email: testEmail } });
            expect(userAfter.resetPasswordOtp).toBeNull();
            expect(userAfter.resetPasswordOtpExpires).toBeNull();
            expect(userAfter.password).toMatch(/^\$2[aby]\$12\$/);

            // Verify user can log in with new password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'BrandNewSecurePassword123!',
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
            expect(loginRes.body.token).toBeDefined();

            // Verify old password fails
            const oldLoginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'InitialPassword123!',
                });

            expect(oldLoginRes.status).toBe(401);
        });
    });

    describe('Google OAuth Login Flow (POST /api/auth/google-login)', () => {
        const { OAuth2Client } = require('google-auth-library');
        let verifySpy;

        beforeAll(() => {
            verifySpy = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation(async ({ idToken }) => {
                if (idToken === 'valid-google-new-user-token') {
                    return {
                        getPayload: () => ({
                            sub: 'google-uid-new-123456',
                            email: 'googlenew@test.com',
                            name: 'Google Newbie',
                            picture: 'https://lh3.googleusercontent.com/a/newbie-pic',
                            email_verified: true,
                        }),
                    };
                }
                if (idToken === 'valid-google-existing-email-token') {
                    return {
                        getPayload: () => ({
                            sub: 'google-uid-link-789012',
                            email: 'existinglink@test.com',
                            name: 'Existing Link User',
                            picture: 'https://lh3.googleusercontent.com/a/link-pic',
                            email_verified: true,
                        }),
                    };
                }
                throw new Error('Invalid token signature or expired');
            });
        });

        afterAll(() => {
            if (verifySpy) verifySpy.mockRestore();
        });

        it('POST /api/auth/google-login - registers new user via Google token, sets googleId, returns JWT & user', async () => {
            const res = await request(app)
                .post('/api/auth/google-login')
                .send({ idToken: 'valid-google-new-user-token' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe('googlenew@test.com');
            expect(res.body.user.name).toBe('Google Newbie');

            const dbUser = await User.findOne({ where: { email: 'googlenew@test.com' } });
            expect(dbUser).not.toBeNull();
            expect(dbUser.googleId).toBe('google-uid-new-123456');
            expect(dbUser.avatar).toBe('https://lh3.googleusercontent.com/a/newbie-pic');
            expect(dbUser.isEmailVerified).toBe(true);
        });

        it('POST /api/auth/google-login - accepts credential field (GIS standard) and signs in existing user', async () => {
            // Re-login same user with credential parameter
            const res = await request(app)
                .post('/api/auth/google-login')
                .send({ credential: 'valid-google-new-user-token' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('googlenew@test.com');
        });

        it('POST /api/auth/google-login - links googleId if user exists with matching email', async () => {
            await User.create({
                name: 'Existing Account',
                email: 'existinglink@test.com',
                password: 'InitialPassword123!',
                role: 'student',
            });

            const res = await request(app)
                .post('/api/auth/google-login')
                .send({ idToken: 'valid-google-existing-email-token' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const dbUser = await User.findOne({ where: { email: 'existinglink@test.com' } });
            expect(dbUser.googleId).toBe('google-uid-link-789012');
        });

        it('POST /api/auth/google-login - rejects invalid or forged Google tokens with 401', async () => {
            const res = await request(app)
                .post('/api/auth/google-login')
                .send({ idToken: 'forged-token-abc' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid or expired google token/i);
        });

        it('POST /api/auth/google-login - rejects request with missing token with 400', async () => {
            const res = await request(app)
                .post('/api/auth/google-login')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/google id token or credential is required/i);
        });
    });
});

