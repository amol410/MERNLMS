#!/usr/bin/env node

/**
 * TST-01: True MySQL Multi-Connection Parallel Concurrency Verification Harness
 * DolphinCoder LMS
 *
 * Verifies that concurrent transactions execute truly in parallel across separate
 * database connections with real InnoDB row locking (SELECT ... FOR UPDATE),
 * without artificial single-file Promise queues.
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const rawHost = process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1';
const DB_HOST = rawHost.split(',')[0].replace(/['"]/g, '').trim() || '127.0.0.1';
const DB_PORT = parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '3306', 10);
const DB_USER = (process.env.TEST_DB_USER || process.env.DB_USER || '').replace(/['"]/g, '').trim();
const DB_PASSWORD = (process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '').replace(/['"]/g, '').trim();
const DB_NAME = (process.env.TEST_DB_NAME || process.env.DB_NAME || '').replace(/['"]/g, '').trim();

async function runConcurrencyHarness() {
    console.log('========================================================================================');
    console.log('  🐬 DOLPHINCODER LMS — TST-01 REAL MYSQL CONCURRENCY VERIFICATION HARNESS');
    console.log('========================================================================================');
    console.log(`Target Host:       ${DB_HOST}:${DB_PORT}`);
    console.log(`Database:          ${DB_NAME || '(Not configured)'}`);
    console.log(`Connection Pool:   max: 10, min: 2, acquire: 15000ms`);

    if (!DB_USER || !DB_NAME) {
        console.log('\n⚠️ MySQL database credentials are not set in environment or backend/.env.');
        console.log('   To test against a live or local MySQL database, execute with:');
        console.log('   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASSWORD=... TEST_DB_NAME=lms_test node scripts/verify_mysql_concurrency.js\n');
        console.log('ℹ️ Unit tests continue to use the safe in-memory SQLite runner by default.');
        return;
    }

    const testSequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 2,
            acquire: 15000,
            idle: 10000,
        },
    });

    try {
        await testSequelize.authenticate();
        console.log('✅ Connected to MySQL database successfully.');
    } catch (authErr) {
        console.log(`\n⚠️ Unable to connect to MySQL on ${DB_HOST}:${DB_PORT}: ${authErr.message}`);
        console.log('   Skipping live concurrency verification. (Offline SQLite tests remain active).');
        return;
    }

    try {
        // Define minimal User model bound to the active multi-connection pool
        const User = testSequelize.define('User', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: Sequelize.STRING, allowNull: false },
            email: { type: Sequelize.STRING, allowNull: false, unique: true },
            password: { type: Sequelize.STRING, allowNull: false },
            role: { type: Sequelize.STRING, defaultValue: 'student' },
            oxygen: { type: Sequelize.INTEGER, defaultValue: 5 },
            pearls: { type: Sequelize.INTEGER, defaultValue: 0 },
            lastOxygenRefill: { type: Sequelize.DATE, allowNull: true },
        }, {
            tableName: 'users',
            timestamps: true,
        });

        // 1. Create isolated test user with exactly 50 pearls and 0 oxygen
        const testEmail = `concurrency_test_${Date.now()}@dolphincoder.test`;
        const testUser = await User.create({
            name: 'Concurrency Stress User',
            email: testEmail,
            password: 'MockHashedPassword123!',
            role: 'student',
            pearls: 50,
            oxygen: 0,
        });

        console.log(`\n👤 Created test user ID ${testUser.id} with balance: Pearls=50, Oxygen=0`);
        console.log('🚀 Firing 5 simultaneous parallel transactions to refill oxygen (Cost: 50 pearls each)...');
        console.log('   (Verifying InnoDB SELECT ... FOR UPDATE row locking without Promise queue)\n');

        // Simulated refill transaction matching backend/controllers/gamificationController.js
        const simulateRefillTransaction = async (requestId) => {
            const start = Date.now();
            try {
                const result = await testSequelize.transaction(async (transaction) => {
                    // True InnoDB row lock: SELECT ... FOR UPDATE
                    const lockedUser = await User.findByPk(testUser.id, {
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    });

                    if (!lockedUser) {
                        return { id: requestId, status: 404, message: 'User not found' };
                    }

                    if (lockedUser.oxygen >= 5) {
                        return { id: requestId, status: 400, message: 'Oxygen is already full' };
                    }

                    const cost = 50;
                    if ((lockedUser.pearls || 0) < cost) {
                        return { id: requestId, status: 400, message: 'Not enough pearls (50 required)' };
                    }

                    // Deduct pearls and restore oxygen
                    lockedUser.pearls -= cost;
                    lockedUser.oxygen = 5;
                    lockedUser.lastOxygenRefill = new Date();
                    await lockedUser.save({ transaction });

                    return {
                        id: requestId,
                        status: 200,
                        message: 'Oxygen fully restored!',
                        oxygen: lockedUser.oxygen,
                        pearls: lockedUser.pearls,
                    };
                });
                return { ...result, durationMs: Date.now() - start };
            } catch (err) {
                return { id: requestId, status: 500, message: err.message, durationMs: Date.now() - start };
            }
        };

        // Fire 5 simultaneous requests via Promise.all
        const results = await Promise.all([
            simulateRefillTransaction(1),
            simulateRefillTransaction(2),
            simulateRefillTransaction(3),
            simulateRefillTransaction(4),
            simulateRefillTransaction(5),
        ]);

        console.table(results.map(r => ({
            'Request #': r.id,
            'Status': r.status,
            'Message': r.message,
            'Duration': `${r.durationMs}ms`,
        })));

        const successCount = results.filter(r => r.status === 200).length;
        const rejectedCount = results.filter(r => r.status === 400).length;

        // Verify database final state
        const refreshedUser = await User.findByPk(testUser.id);

        console.log('\n📊 Concurrency Verification Assessment:');
        console.log(`   • Successful Transactions:  ${successCount} (Expected: 1)`);
        console.log(`   • Safely Rejected:          ${rejectedCount} (Expected: 4)`);
        console.log(`   • Final Pearls Balance:     ${refreshedUser.pearls} (Expected: 0)`);
        console.log(`   • Final Oxygen Balance:     ${refreshedUser.oxygen} (Expected: 5)`);

        const isDoubleSpendPrevented = successCount === 1 && rejectedCount === 4 && refreshedUser.pearls === 0 && refreshedUser.oxygen === 5;

        if (isDoubleSpendPrevented) {
            console.log('\n✅ PASSED: True MySQL concurrency validated! Double-spending prevented via InnoDB row locking.');
        } else {
            console.error('\n❌ FAILED: Race condition detected! Multiple transactions succeeded or balance negative.');
        }

        // Cleanup
        await testUser.destroy();
        console.log(`🧹 Cleaned up temporary test user ID ${testUser.id}.`);
    } catch (err) {
        console.error('❌ Error during concurrency verification:', err.message);
    } finally {
        await testSequelize.close();
    }
}

runConcurrencyHarness().catch(console.error);
