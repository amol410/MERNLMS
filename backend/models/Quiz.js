const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define('Quiz', {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdBy:   { type: DataTypes.INTEGER, allowNull: false },
    title:       { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    questions: {
          type: DataTypes.TEXT('long'), defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('questions')); } catch(e) { return []; } },
          set(val) { this.setDataValue('questions', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    tags: {
          type: DataTypes.TEXT, defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('tags')); } catch(e) { return []; } },
          set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    totalPoints:      { type: DataTypes.INTEGER, defaultValue: 0 },
    passingScore:     { type: DataTypes.INTEGER, defaultValue: 70 },
    timeLimit:        { type: DataTypes.INTEGER, defaultValue: 0 },
    shuffleQuestions: { type: DataTypes.BOOLEAN, defaultValue: false },
    isPublished:      { type: DataTypes.BOOLEAN, defaultValue: true },
    attemptLimit:     { type: DataTypes.INTEGER, defaultValue: null },
}, { tableName: 'quizzes', timestamps: true });

Quiz.beforeSave((instance) => {
    const questions = instance.questions;
    if (Array.isArray(questions)) {
          instance.totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    }
});

module.exports = Quiz;
