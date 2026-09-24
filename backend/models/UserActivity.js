const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserActivity = sequelize.define('UserActivity', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    activityType: {
        type: DataTypes.ENUM('quiz', 'note', 'flashcard'),
        allowNull: false,
    },
    resourceId: { type: DataTypes.INTEGER, allowNull: false },
    resourceTitle: { type: DataTypes.STRING(255), defaultValue: '' },
    subjectName: { type: DataTypes.STRING(100), defaultValue: null },
    topicName: { type: DataTypes.STRING(100), defaultValue: null },
    // Flexible JSON blob — stores type-specific metrics
    // quiz:      { attemptCount, timeTakenSecs, score, maxScore, percentage, passed }
    // note:      { engagementSecs }
    // flashcard: { engagementSecs, cardCount, masteredCount }
    metadata: {
        type: DataTypes.TEXT('long'),
        defaultValue: '{}',
        get() {
            try { return JSON.parse(this.getDataValue('metadata')); } catch (e) { return {}; }
        },
        set(val) {
            this.setDataValue('metadata', JSON.stringify(val && typeof val === 'object' ? val : {}));
        },
    },
    // DATEONLY for efficient day-based queries (avoids time zone issues)
    activityDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    tableName: 'user_activities',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'activityDate'] },
        { fields: ['activityType'] },
    ],
});

module.exports = UserActivity;
