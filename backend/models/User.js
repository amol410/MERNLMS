const crypto = require('crypto');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: true },
    googleId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    resetPasswordOtp: { type: DataTypes.STRING(6), allowNull: true },
    resetPasswordOtpExpires: { type: DataTypes.DATE, allowNull: true },
    resetPasswordOtpAttempts: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'reset_password_otp_attempts' },
    resetPasswordOtpLockedUntil: { type: DataTypes.DATE, allowNull: true, field: 'reset_password_otp_locked_until' },
    isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_email_verified' },
    verificationOtp: { type: DataTypes.STRING(6), allowNull: true, field: 'verification_otp' },
    verificationOtpExpires: { type: DataTypes.DATE, allowNull: true, field: 'verification_otp_expires' },
    verificationOtpAttempts: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'verification_otp_attempts' },
    verificationOtpLockedUntil: { type: DataTypes.DATE, allowNull: true, field: 'verification_otp_locked_until' },
    role: { type: DataTypes.ENUM('student', 'trainer', 'admin'), defaultValue: 'student' },
    avatar: { type: DataTypes.STRING(500), defaultValue: null },
    bio: { type: DataTypes.TEXT, defaultValue: '' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLogin: { type: DataTypes.DATE, defaultValue: null },

    // Gamification & In-Game Economy
    streakCount: { type: DataTypes.INTEGER, defaultValue: 1, field: 'streak_count' },
    longestStreak: { type: DataTypes.INTEGER, defaultValue: 1, field: 'longest_streak' },
    lastActiveDate: { type: DataTypes.DATEONLY, defaultValue: null, field: 'last_active_date' },
    dailyTargetXp: { type: DataTypes.INTEGER, defaultValue: 20, field: 'daily_target_xp' },
    targetLanguage: { type: DataTypes.STRING(10), defaultValue: 'de', field: 'target_language' },
    nativeLanguage: { type: DataTypes.STRING(10), defaultValue: 'en', field: 'native_language' },
    currentLevel: { type: DataTypes.STRING(10), defaultValue: 'A1', field: 'current_level' },
    pearls: { type: DataTypes.INTEGER, defaultValue: 10, field: 'pearls' },
    oxygen: { type: DataTypes.INTEGER, defaultValue: 5, field: 'oxygen' },
    lastOxygenRefill: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'last_oxygen_refill' },
    streakFreezeCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'streak_freeze_count' },
    doubleXpExpiresAt: { type: DataTypes.DATE, defaultValue: null, field: 'double_xp_expires_at' },
    totalXp: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_xp' },
    currentLeague: { type: DataTypes.STRING(50), defaultValue: 'Coral Reef', field: 'current_league' },
    fcmToken: { type: DataTypes.STRING(500), allowNull: true, field: 'fcm_token' },

    // Duolingo-Style Placement & Tiered Difficulty Engine (Additive Schema - Shared DB Safe)
    placementCompleted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false, field: 'placement_completed' },
    placementLevel: { type: DataTypes.STRING(10), allowNull: true, defaultValue: null, field: 'placement_level' },
    placementSkipToNode: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0, field: 'placement_skip_to_node' },
    placementSkipMap: { type: DataTypes.STRING(500), allowNull: true, defaultValue: '{}', field: 'placement_skip_map' },
    placementTestDate: { type: DataTypes.DATE, allowNull: true, defaultValue: null, field: 'placement_test_date' },
    unlockedLevels: { type: DataTypes.STRING(255), allowNull: true, defaultValue: '["A1"]', field: 'unlocked_levels' },

    // Session/token revocation counter (SEC-06).
    // Every JWT embeds the value it was signed with; the `protect` middleware
    // rejects tokens whose `tokenVersion` no longer matches the user's row.
    // Incremented on password change/reset so any previously issued token
    // (including a stolen one) is invalidated immediately.
    tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'token_version' },
}, { tableName: 'users', timestamps: true });

User.beforeCreate(async (user) => {
    if (user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
    }
});

User.prototype.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.getSignedJwtToken = function() {
    return jwt.sign({
        id: this.id,
        // Include the current session version so password changes can revoke it.
        tokenVersion: this.tokenVersion || 0,
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * Rotates the session version, invalidating every JWT issued to this user.
 * Uses a DB-level atomic increment so parallel password changes cannot lose
 * an update. Also refreshes the in-memory value on the instance.
 * @returns {Promise<number>} the new token version
 */
User.prototype.invalidateSessions = async function() {
    await this.increment('tokenVersion');
    await this.reload({ attributes: ['tokenVersion'] });
    return this.tokenVersion;
};

// Constant-time string comparison (defense-in-depth against timing attacks on OTP matching).
User.compareTimingSafe = function(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

module.exports = User;
