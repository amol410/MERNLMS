const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
    id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    addedBy:        { type: DataTypes.INTEGER, allowNull: false },
    title:          { type: DataTypes.STRING(200), allowNull: false },
    description:    { type: DataTypes.TEXT, defaultValue: '' },
    youtubeUrl:     { type: DataTypes.STRING(500), allowNull: false },
    youtubeVideoId: { type: DataTypes.STRING(50), allowNull: false },
    thumbnailUrl:   { type: DataTypes.STRING(500), defaultValue: null },
    tags: {
          type: DataTypes.TEXT, defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('tags')); } catch(e) { return []; } },
          set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    isPublic:  { type: DataTypes.BOOLEAN, defaultValue: true },
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'videos', timestamps: true });

module.exports = Video;
