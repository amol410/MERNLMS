const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { invalidateUserCache } = require('../middleware/auth');
const { sendPasswordResetOtpEmail, sendVerificationOtpEmail } = require('../services/emailService');

// Security tuning for OTP brute-force protection (industry-standard attempt limiting).
const OTP_MAX_ATTEMPTS = 5;              // Allow a small number of guesses before lockout.
const OTP_LOCKOUT_MINUTES = 15;          // Lockout window after exceeding the attempt limit.
const OTP_TOTAL_MAX_ATTEMPTS = 10;       // Hard ceiling across multiple windows (forces re-issue).
const LOCKOUT_MS = OTP_LOCKOUT_MINUTES * 60 * 1000;

/**
 * Shared helper: enforce attempt throttling + lockout against a set of counter/lockout
 * fields on a user instance. Returns a frozen object the caller should send to the client,
 * or null when the request may proceed. On `recordFailure` it persists the increment.
 *
 * @param {object} user        Sequelize user instance
 * @param {string} attemptsKey field holding the running failed-attempt count
 * @param {string} lockedKey   field holding the lockout expiration timestamp
 * @param {object} [opts]      overrides
 * @param {boolean} [opts.persistFailure] whether to persist the recorded failure
 * @returns {{ block: boolean, status: number, message: string, retryAfterSeconds: number } | null}
 */
async function checkOtpLockout(user, attemptsKey, lockedKey, opts = {}) {
    const now = Date.now();
    const lockedUntil = user[lockedKey] ? new Date(user[lockedKey]).getTime() : 0;

    // Active lockout -> block immediately.
    if (lockedUntil > now) {
        return {
            block: true,
            status: 429,
            message: `Too many verification attempts. Please try again in ${OTP_LOCKOUT_MINUTES} minutes or request a new code.`,
            retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
        };
    }

    // Past lockout expired -> reset the per-window counter (not the lifetime ceiling).
    if (lockedUntil && lockedUntil <= now) {
        user[lockedKey] = null;
    }

    const attempts = user[attemptsKey] || 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
        user[attemptsKey] = 0;
        user[lockedKey] = new Date(now + LOCKOUT_MS);
        await user.save();
        return {
            block: true,
            status: 429,
            message: `Too many verification attempts. Please try again in ${OTP_LOCKOUT_MINUTES} minutes or request a new code.`,
            retryAfterSeconds: OTP_LOCKOUT_MINUTES * 60,
        };
    }

    if (opts.persistFailure) {
        user[attemptsKey] = attempts + 1;
        await user.save();
    }

    return null;
}

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

/**
 * @desc    Register new user & dispatch 6-digit Email Verification OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Account already exists with this email. Please log in.',
        });
      }

      // Existing unverified account: update credentials & send fresh OTP
      existing.name = name;
      existing.password = password;
      const otp = crypto.randomInt(100000, 1000000).toString();
      existing.verificationOtp = otp;
      existing.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await existing.save();

      try {
        await sendVerificationOtpEmail(existing.email, otp, existing.name);
      } catch (emailErr) {
        console.error('⚠️ [AuthController] Error sending verification email to existing unverified user:', emailErr.message);
      }

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: existing.email,
        message: 'Verification code sent to your email.',
      });
    }

    // New user registration
    const otp = crypto.randomInt(100000, 1000000).toString();
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      isEmailVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    try {
      await sendVerificationOtpEmail(user.email, otp, user.name);
    } catch (emailErr) {
      console.error('⚠️ [AuthController] Error sending registration verification email:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Registration 6-Digit OTP and activate account
 * @route   POST /api/auth/verify-registration-otp
 * @access  Public
 */
exports.verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and 6-digit verification code' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const formattedOtp = otp.toString().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return sendToken(user, 200, res);
    }

    // Rate-limit / lockout guard against brute-forcing the 6-digit code.
    const lockout = await checkOtpLockout(user, 'verificationOtpAttempts', 'verificationOtpLockedUntil');
    if (lockout) {
      res.set('Retry-After', String(lockout.retryAfterSeconds));
      return res.status(lockout.status).json({ success: false, message: lockout.message });
    }

    if (!user.verificationOtp || !user.verificationOtpExpires) {
      await checkOtpLockout(user, 'verificationOtpAttempts', 'verificationOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    if (new Date() > new Date(user.verificationOtpExpires)) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (!User.compareTimingSafe(user.verificationOtp, formattedOtp)) {
      await checkOtpLockout(user, 'verificationOtpAttempts', 'verificationOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    user.verificationOtpAttempts = 0;
    user.verificationOtpLockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend Registration 6-Digit OTP
 * @route   POST /api/auth/resend-registration-otp
 * @access  Public
 */
exports.resendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified. Please log in.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.verificationOtp = otp;
    user.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.verificationOtpAttempts = 0;
    user.verificationOtpLockedUntil = null;
    await user.save();

    try {
      await sendVerificationOtpEmail(user.email, otp, user.name);
    } catch (emailErr) {
      console.error('⚠️ [AuthController] Error resending verification email:', emailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code resent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    User Login (requires isEmailVerified)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Require email verification before allowing login
    if (!user.isEmailVerified) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.verificationOtp = otp;
      user.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      try {
        await sendVerificationOtpEmail(user.email, otp, user.name);
      } catch (emailErr) {
        console.error('⚠️ [AuthController] Error auto-sending verification OTP on login:', emailErr.message);
      }

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Please verify your email before logging in. A new verification code has been sent.',
      });
    }

    user.lastLogin = new Date();
    user.save().catch(err => console.error('⚠️ [AuthController] lastLogin async save error:', err.message));

    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, targetLanguage, nativeLanguage, currentLevel } = req.body;
    const user = await User.findByPk(req.user.id);
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (targetLanguage !== undefined) user.targetLanguage = targetLanguage;
    if (nativeLanguage !== undefined) user.nativeLanguage = nativeLanguage;
    if (currentLevel !== undefined) user.currentLevel = currentLevel;
    await user.save();
    res.status(200).json({
      success: true,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        targetLanguage: user.targetLanguage,
        nativeLanguage: user.nativeLanguage,
        currentLevel: user.currentLevel,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await User.findByPk(req.user.id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // SEC-06: revoke every previously issued token (including any held by an
    // attacker), then drop the cached row so the new version takes effect
    // immediately rather than after the 60s cache TTL.
    await user.invalidateSessions();
    invalidateUserCache(user.id);

    // Hand the caller a fresh token so the legitimate session continues.
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset OTP (6 digits) via Hostinger SMTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLockedUntil = null;
    await user.save();

    // Send branded email via Hostinger SMTP
    try {
      await sendPasswordResetOtpEmail(user.email, otp, user.name);
    } catch (emailErr) {
      console.error('⚠️ [AuthController] Failed to send OTP email:', emailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send password reset email. Please try again later.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify 6-digit OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and 6-digit OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const formattedOtp = otp.toString().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Rate-limit / lockout guard against brute-forcing the 6-digit OTP.
    const lockout = await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil');
    if (lockout) {
      res.set('Retry-After', String(lockout.retryAfterSeconds));
      return res.status(lockout.status).json({ success: false, message: lockout.message });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (!User.compareTimingSafe(user.resetPasswordOtp, formattedOtp)) {
      await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Successful verification: reset the throttle so reset-password can proceed.
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLockedUntil = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using verified OTP (bcrypt 12 rounds)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password, newPassword } = req.body;
    const targetPassword = newPassword || password;

    if (!email || !otp || !targetPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    if (targetPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const formattedOtp = otp.toString().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Rate-limit / lockout guard against brute-forcing the 6-digit OTP.
    const lockout = await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil');
    if (lockout) {
      res.set('Retry-After', String(lockout.retryAfterSeconds));
      return res.status(lockout.status).json({ success: false, message: lockout.message });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (!User.compareTimingSafe(user.resetPasswordOtp, formattedOtp)) {
      await checkOtpLockout(user, 'resetPasswordOtpAttempts', 'resetPasswordOtpLockedUntil', { persistFailure: true });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Set new password (auto-hashed with 12 rounds in User.beforeUpdate) and clear OTP fields
    user.password = targetPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLockedUntil = null;
    user.isEmailVerified = true;
    await user.save();

    // SEC-06: a password reset must evict any session an attacker may hold.
    await user.invalidateSessions();
    invalidateUserCache(user.id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google OAuth login (via idToken or credential)
 * @route   POST /api/auth/google-login
 * @access  Public
 */
exports.googleLogin = async (req, res, next) => {
  try {
    const token = req.body.idToken || req.body.credential || req.body.id_token || req.body.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google ID token or credential is required' });
    }

    const defaultClientIds = [
      '954842353363-3es8j5j88oinub65ln43563atq6166r5.apps.googleusercontent.com',
      '954842353363-d1rduacuqb0easj85t8ejhf22ih0erre.apps.googleusercontent.com',
      '954842353363-arjj1qqm2csgpri2fvn3uv7223fgdaa3.apps.googleusercontent.com',
      '954842353363-sbrtsu5c3n62bm82g9sptv0maf0jvpbg.apps.googleusercontent.com',
    ];
    const envClientIds = (process.env.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    const allowedAudiences = Array.from(new Set([...envClientIds, ...defaultClientIds]));
    const client = new OAuth2Client(envClientIds[0] || defaultClientIds[0]);

    // Verify the ID token cryptographically (signature, issuer, audience, expiry).
    let payload = null;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token: ' + verifyErr.message,
      });
    }

    // Reject tokens that don't carry a verified, non-null Google subject.
    if (!payload || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Failed to retrieve Google profile' });
    }

    // SECURITY: only trust the cryptographically verified payload — never req.body.
    // This prevents account takeovers where an attacker submits their own valid token
    // plus an arbitrary req.body.email/name/avatar to impersonate a victim.
    if (payload.email_verified !== true || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google account does not provide a verified email address',
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture || null;

    // 1. Try finding user by googleId
    let user = await User.findOne({ where: { googleId } });
    if (user && !user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    // 2. If not found by googleId, find by email and link googleId
    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
    }

    // 3. If still not found, create new user (always verified for Google users)
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name,
        email,
        password: randomPassword,
        googleId,
        avatar,
        role: 'student',
        isEmailVerified: true,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    user.lastLogin = new Date();
    user.save().catch(err => console.error('⚠️ [AuthController] lastLogin async save error:', err.message));

    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
