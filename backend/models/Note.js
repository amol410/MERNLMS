const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Note = sequelize.define('Note', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    owner: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    tags: {
          type: DataTypes.TEXT, defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('tags')); } catch(e) { return []; } },
          set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
    color: { type: DataTypes.ENUM('default','blue','green','yellow','pink','purple'), defaultValue: 'default' },
}, { tableName: 'notes', timestamps: true });

module.exports = Note;
