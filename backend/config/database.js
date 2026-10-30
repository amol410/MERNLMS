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
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
    });
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
                max: 5,
                min: 0,
                acquire: 30000,
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
