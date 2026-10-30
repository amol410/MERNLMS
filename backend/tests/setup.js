const { sequelize } = require('../config/database');
require('../models/associations');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    try {
        await sequelize.close();
    } catch (_) {}
});

const createTestUser = async (overrides = {}) => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const email = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@test.com`;
    const user = await User.create({
        name: 'Test User',
        email,
        password: hashedPassword,
        isEmailVerified: true,
        role: 'student',
        oxygen: 5,
        pearls: 100,
        totalXp: 0,
        streakCount: 1,
        learningLanguage: 'de',
        nativeLanguage: 'en',
        currentLevel: 'A1',
        ...overrides,
    });

    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET || 'dolphinCoderLMS2026ProductionSecretKeyX9a7b3c8d2e1f4g5h6',
        { expiresIn: '1d' }
    );

    return { user, token };
};

const createTestAdmin = async (overrides = {}) => {
    return createTestUser({
        name: 'Admin Boss',
        role: 'admin',
        ...overrides,
    });
};

module.exports = {
    sequelize,
    createTestUser,
    createTestAdmin,
};
