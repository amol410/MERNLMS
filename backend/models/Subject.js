const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subject = sequelize.define('Subject', {
    id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    _id:  { type: DataTypes.VIRTUAL, get() { return this.id; } },
    name: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    topics: {
        type: DataTypes.TEXT, defaultValue: '[]',
        get() {
            try { return JSON.parse(this.getDataValue('topics')); } catch(e) { return []; }
        },
        set(val) {
            this.setDataValue('topics', JSON.stringify(Array.isArray(val) ? val : []));
        },
    },
}, { tableName: 'subjects', timestamps: true });

module.exports = Subject;
