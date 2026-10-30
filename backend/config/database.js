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
        await sequelize.sync({ alter: true });
        console.log('✅ All tables synced');

        // Safe check for auth columns (resetPasswordOtp, resetPasswordOtpExpires, googleId)
        try {
            const queryInterface = sequelize.getQueryInterface();
            const tableDescription = await queryInterface.describeTable('users');
            if (!tableDescription.resetPasswordOtp && !tableDescription.reset_password_otp) {
                await queryInterface.addColumn('users', 'resetPasswordOtp', {
                    type: Sequelize.STRING(6),
                    allowNull: true,
                }).catch(() => {});
            }
            if (!tableDescription.resetPasswordOtpExpires && !tableDescription.reset_password_otp_expires) {
                await queryInterface.addColumn('users', 'resetPasswordOtpExpires', {
                    type: Sequelize.DATE,
                    allowNull: true,
                }).catch(() => {});
            }
            if (!tableDescription.googleId && !tableDescription.google_id) {
                await queryInterface.addColumn('users', 'googleId', {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    unique: true,
                }).catch(() => {});
            }
        } catch (colErr) {
            // In case table description fails or columns already present
        }

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
