const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendPasswordResetOtpEmail, sendVerificationOtpEmail } = require('../services/emailService');

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

    if (!user.verificationOtp || user.verificationOtp !== formattedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    if (!user.verificationOtpExpires || new Date() > new Date(user.verificationOtpExpires)) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
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

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== formattedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

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

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== formattedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Set new password (auto-hashed with 12 rounds in User.beforeUpdate) and clear OTP fields
    user.password = targetPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.isEmailVerified = true;
    await user.save();

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
    const accessToken = req.body.accessToken || req.body.access_token;
    if (!token && !accessToken) {
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

    let payload = null;
    if (token) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        if (!accessToken) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired Google token: ' + verifyErr.message,
          });
        }
      }
    }

    if (!payload && accessToken) {
      try {
        const tokenInfo = await client.getTokenInfo(accessToken);
        if (!tokenInfo || !tokenInfo.sub) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired Google access token',
          });
        }
        payload = {
          sub: tokenInfo.sub,
          email: tokenInfo.email || req.body.email,
          name: req.body.name || (tokenInfo.email ? tokenInfo.email.split('@')[0] : 'Google User'),
          picture: req.body.avatar || req.body.photoUrl || null,
          email_verified: true,
        };
      } catch (accessErr) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired Google token: ' + accessErr.message,
        });
      }
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Failed to retrieve Google profile' });
    }

    const googleId = payload.sub;
    const email = payload.email ? payload.email.toLowerCase().trim() : null;
    const name = payload.name || (email ? email.split('@')[0] : 'Google User');
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
      if (!email) {
        return res.status(400).json({ success: false, message: 'Google account does not provide an email address' });
      }
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
