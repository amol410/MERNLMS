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
}, { tableName: 'users', timestamps: true });

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
