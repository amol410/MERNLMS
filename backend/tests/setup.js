const { sequelize } = require('../config/database');
require('../models/associations');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Ensure isolated in-memory test JWT secret is always set (SEC-01 / SEC-11 hygiene)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'in_memory_mock_jwt_test_secret_only';

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
        process.env.JWT_SECRET,
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
