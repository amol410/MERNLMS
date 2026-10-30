const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendPasswordResetOtpEmail } = require('../services/emailService');

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
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ name, email, password, role: 'student' });
    sendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
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
    const token = req.body.idToken || req.body.credential || req.body.id_token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google ID token or credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId || undefined,
      });
    } catch (verifyErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token: ' + verifyErr.message,
      });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Failed to retrieve Google profile' });
    }

    const googleId = payload.sub;
    const email = payload.email ? payload.email.toLowerCase().trim() : null;
    const name = payload.name || (email ? email.split('@')[0] : 'Google User');
    const avatar = payload.picture || null;

    // 1. Try finding user by googleId
    let user = await User.findOne({ where: { googleId } });

    // 2. If not found by googleId, find by email and link googleId
    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
    }

    // 3. If still not found, create new user
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
      });
    }

    user.lastLogin = new Date();
    user.save().catch(err => console.error('⚠️ [AuthController] lastLogin async save error:', err.message));

    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
