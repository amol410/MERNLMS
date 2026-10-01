const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlashcardProgress = sequelize.define('FlashcardProgress', {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student:   { type: DataTypes.INTEGER, allowNull: false },
    flashcard: { type: DataTypes.INTEGER, allowNull: false },
    cardResults: {
          type: DataTypes.TEXT('long'), defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('cardResults')); } catch(e) { return []; } },
          set(val) { this.setDataValue('cardResults', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    sessionCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
    masteredCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastStudiedAt: { type: DataTypes.DATE, defaultValue: null },
}, {
    tableName: 'flashcard_progress',
    timestamps: true,
    indexes: [{ unique: true, fields: ['student', 'flashcard'] }]
});

module.exports = FlashcardProgress;
