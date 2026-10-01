const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CurriculumLesson = sequelize.define('CurriculumLesson', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    _id: { 
        type: DataTypes.VIRTUAL, 
        get() { return this.id; } 
    },
    owner: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    learningLanguage: {
        type: DataTypes.STRING(10),
        defaultValue: 'de',
        allowNull: false,
    },
    nativeLanguage: {
        type: DataTypes.STRING(10),
        defaultValue: 'en',
        allowNull: false,
    },
    level: {
        type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
        defaultValue: 'A1',
        allowNull: false,
    },
    unitNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
    },
    unitTitle: {
        type: DataTypes.STRING(200),
        defaultValue: 'Coral Reef',
        allowNull: false,
    },
    unitDescription: {
        type: DataTypes.STRING(300),
        defaultValue: 'Introductions & Daily Greetings',
    },
    lessonIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    subtitle: {
        type: DataTypes.STRING(300),
        defaultValue: '',
    },
    nodeType: {
        type: DataTypes.ENUM('lesson', 'karaoke', 'speech', 'chest', 'match', 'quiz'),
        defaultValue: 'lesson',
    },
    xpReward: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
    },
    pearlsReward: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
    },
    // CRITICAL: Default OFF / Not Live until admin or trainer explicitly toggles it live
    isLive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    // Modular challenge stages array: [ { type: 'word_match', ... }, { type: 'listen_tap', ... } ]
    stages: {
        type: DataTypes.TEXT('long'),
        defaultValue: '[]',
        get() {
            try { return JSON.parse(this.getDataValue('stages')); } catch (e) { return []; }
        },
        set(val) {
            this.setDataValue('stages', JSON.stringify(Array.isArray(val) ? val : []));
        },
    },
    // Synced Karaoke lyrics & word timestamps (optional)
    karaokeData: {
        type: DataTypes.TEXT('long'),
        defaultValue: null,
        get() {
            try { return JSON.parse(this.getDataValue('karaokeData')); } catch (e) { return null; }
        },
        set(val) {
            this.setDataValue('karaokeData', val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null);
        },
    },
    audioUrl: {
        type: DataTypes.STRING(500),
        defaultValue: null,
    },
    sourceNoteId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
    },
}, {
    tableName: 'curriculum_lessons',
    timestamps: true,
    indexes: [
        { fields: ['learningLanguage', 'nativeLanguage', 'level', 'unitNumber'] },
        { fields: ['isLive'] },
        { fields: ['owner'] },
    ],
});

module.exports = CurriculumLesson;
