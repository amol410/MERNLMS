const { Sequelize } = require('sequelize');

// Support MongoDB-style instance._id and toJSON() without generating invalid SQL VIRTUAL column
Object.defineProperty(Sequelize.Model.prototype, '_id', {
    get() { return this.id; },
    configurable: true,
});

const origToJSON = Sequelize.Model.prototype.toJSON;
Sequelize.Model.prototype.toJSON = function() {
    const values = origToJSON ? origToJSON.call(this) : { ...this.get() };
    if (this.id !== undefined && values._id === undefined) {
        values._id = this.id;
    }
    return values;
};

let sequelize;

if (process.env.NODE_ENV === 'test') {
    const isMysqlTest = process.env.TEST_DB_DIALECT === 'mysql';

    if (isMysqlTest) {
        // Real MySQL Test Database: true parallel transactions with multi-connection pool
        // Bypasses the SQLite single-file queue so genuine InnoDB concurrency is tested (TST-01)
        const testDbName = process.env.TEST_DB_NAME || (process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'lms_test');
        sequelize = new Sequelize(
            testDbName,
            process.env.TEST_DB_USER || process.env.DB_USER,
            process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
            {
                host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
                port: process.env.TEST_DB_PORT ? parseInt(process.env.TEST_DB_PORT, 10) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306),
                dialect: 'mysql',
                logging: process.env.DEBUG_SQL === 'true' ? console.log : false,
                pool: {
                    max: 10,
                    min: 1,
                    acquire: 15000,
                    idle: 10000,
                },
            }
        );
    } else {
        // Fast In-Memory SQLite Mock (Default for offline zero-config unit testing)
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
            dialectOptions: {
                busyTimeout: 10000,
            },
        });

        // SQLite in-memory transaction queue to prevent SQLITE_BUSY errors during parallel unit tests
        // NOTE (TST-01): Set TEST_DB_DIALECT=mysql to test true unqueued MySQL parallel transactions
        const originalTransaction = sequelize.transaction.bind(sequelize);
        let sqliteTxQueue = Promise.resolve();
        sequelize.transaction = function(...args) {
            const next = sqliteTxQueue.then(() => originalTransaction(...args));
            sqliteTxQueue = next.catch(() => {});
            return next;
        };
    }
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'mysql',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
                min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN, 10) : 1,
                acquire: process.env.DB_POOL_ACQUIRE ? parseInt(process.env.DB_POOL_ACQUIRE, 10) : 15000,
                idle: 10000,
            },
        }
    );
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        console.log('✅ MySQL Connected:', process.env.DB_HOST);

        // Additive-only self-healing database synchronization (prevents 64-key limit and missing column errors)
        const { selfHealingDatabaseSync } = require('../utils/schemaMigrator');
        await selfHealingDatabaseSync(sequelize);

        // Safe auto-migration for user_node_progress course_id and English curriculum seeding
        try {
            const { migrateUserNodeProgress, seedEnglishCurriculumIfMissing } = require('../utils/curriculumSeeder');
            await migrateUserNodeProgress(sequelize);

            const CurriculumLesson = require('../models/CurriculumLesson');
            seedEnglishCurriculumIfMissing(CurriculumLesson).catch(err => {
                console.warn('Notice on background curriculum seeding:', err.message);
            });
        } catch (mErr) {
            console.warn('Notice on auto-migration/seeding:', mErr.message);
        }
    } catch (error) {
        console.error('❌ MySQL Error:', error.message);
        // Removed process.exit(1) — app will keep running even if DB fails
    }
};

module.exports = { sequelize, connectDB };
