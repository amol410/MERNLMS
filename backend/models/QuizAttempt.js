const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
    quizId: { type: DataTypes.INTEGER, allowNull: false },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    answers: {
        type: DataTypes.TEXT('long'), defaultValue: '[]',
        get() { try { return JSON.parse(this.getDataValue('answers')); } catch(e) { return []; } },
        set(val) { this.setDataValue('answers', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    percentage: { type: DataTypes.FLOAT, defaultValue: 0 },
    passed: { type: DataTypes.BOOLEAN, defaultValue: false },
    attemptNumber: { type: DataTypes.INTEGER, defaultValue: 1 },
    startedAt: { type: DataTypes.DATE, defaultValue: null },
    submittedAt: { type: DataTypes.DATE, defaultValue: null },
    timeTakenSecs: { type: DataTypes.INTEGER, defaultValue: null },
}, { tableName: 'quiz_attempts', timestamps: true });

module.exports = QuizAttempt;