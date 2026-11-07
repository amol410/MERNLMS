/**
 * SEC-06 — Active JWT session invalidation on password change/reset.
 *
 * Verifies that rotating a password revokes previously issued tokens while
 * leaving every other auth path (login, legacy tokens, profile access) intact.
 *
 * NOTE: users are created with a PLAINTEXT password so the model's
 * `beforeCreate` hook hashes it (the pre-hashed `createTestUser` helper would
 * be hashed twice and could never log in).
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { invalidateUserCache } = require('../middleware/auth');
// Loads the shared harness: creates the schema in beforeAll and closes it after.
require('./setup');

const PASSWORD = 'Password123!';

/** Creates a verified user with a known plaintext password and a valid JWT. */
const makeUser = async (overrides = {}) => {
  const user = await User.create({
    name: 'Sec Six User',
    email: `sec6_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@test.com`,
    password: PASSWORD,
    isEmailVerified: true,
    role: 'student',
    ...overrides,
  });
  return { user, token: user.getSignedJwtToken() };
};

describe('SEC-06: JWT Session Invalidation', () => {
  beforeEach(() => invalidateUserCache());

  describe('Password change', () => {
    it('revokes the old token and returns a working replacement', async () => {
      const { user, token: oldToken } = await makeUser();

      // Baseline: the token works.
      const before = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect(before.status).toBe(200);

      const change = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({ currentPassword: PASSWORD, newPassword: 'NewPassword456!' });

      expect(change.status).toBe(200);
      expect(change.body.token).toBeTruthy();
      expect(change.body.token).not.toBe(oldToken);

      // The attacker's (pre-change) token is now rejected.
      const after = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect(after.status).toBe(401);

      // The freshly-issued token still works.
      const fresh = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${change.body.token}`);
      expect(fresh.status).toBe(200);

      // Old password no longer authenticates.
      const loginOld = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD });
      expect(loginOld.status).toBe(401);

      // New password does.
      const loginNew = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'NewPassword456!' });
      expect(loginNew.status).toBe(200);
      expect(loginNew.body.token).toBeTruthy();
    });

    it('increments the persisted tokenVersion exactly once', async () => {
      const { user, token } = await makeUser();
      const originalVersion = user.tokenVersion || 0;

      await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: PASSWORD, newPassword: 'AnotherPass789!' });

      const reloaded = await User.findByPk(user.id);
      expect(reloaded.tokenVersion).toBe(originalVersion + 1);
    });

    it('keeps rejecting a revoked token on repeated use', async () => {
      const { token: oldToken } = await makeUser();

      await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({ currentPassword: PASSWORD, newPassword: 'RepeatCheck123!' });

      for (let i = 0; i < 3; i += 1) {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${oldToken}`);
        expect(res.status).toBe(401);
      }
    });
  });

  describe('Password reset', () => {
    it('revokes previously issued tokens after an OTP reset', async () => {
      const { user, token: oldToken } = await makeUser();
      const otp = '246810';

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.resetPasswordOtpAttempts = 0;
      await user.save();

      // The pre-reset session is active.
      const before = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect(before.status).toBe(200);

      const reset = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: user.email, otp, password: 'ResetPass321!' });
      expect(reset.status).toBe(200);

      const after = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect(after.status).toBe(401);

      // Login with the new password yields a usable token.
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'ResetPass321!' });
      expect(login.status).toBe(200);

      const fresh = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.token}`);
      expect(fresh.status).toBe(200);
    });
  });

  describe('Backward compatibility (no negative effects)', () => {
    it('still accepts legacy tokens that carry no tokenVersion claim', async () => {
      const { user } = await makeUser();

      // Simulates any token minted before this feature shipped.
      const legacyToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${legacyToken}`);
      expect(res.status).toBe(200);
    });

    it('does not revoke sessions merely from profile updates', async () => {
      const { user, token } = await makeUser();

      const update = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', bio: 'Hello there' });
      expect([200, 204]).toContain(update.status);

      const stillValid = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(stillValid.status).toBe(200);

      const reloaded = await User.findByPk(user.id);
      expect(reloaded.tokenVersion || 0).toBe(user.tokenVersion || 0);
    });

    it('does not revoke existing sessions on additional logins', async () => {
      const { user, token } = await makeUser();

      const first = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD });
      const second = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD });

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      // The original session survives additional logins.
      const original = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(original.status).toBe(200);
    });
  });
});
