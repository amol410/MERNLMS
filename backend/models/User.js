const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
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
    pearls: { type: DataTypes.INTEGER, defaultValue: 100, field: 'pearls' },
    oxygen: { type: DataTypes.INTEGER, defaultValue: 5, field: 'oxygen' },
    lastOxygenRefill: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'last_oxygen_refill' },
    totalXp: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_xp' },
    currentLeague: { type: DataTypes.STRING(50), defaultValue: 'Coral Reef', field: 'current_league' },
}, { tableName: 'users', timestamps: true, underscored: true });

User.beforeCreate(async (user) => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    user.password = await bcrypt.hash(user.password, rounds);
});

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
          const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
          user.password = await bcrypt.hash(user.password, rounds);
    }
});

User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.getSignedJwtToken = function() {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

module.exports = User;
