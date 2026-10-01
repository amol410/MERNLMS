const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserNodeProgress = sequelize.define('UserNodeProgress', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    nodeIndex: { type: DataTypes.INTEGER, allowNull: false, field: 'node_index' },
    status: {
        type: DataTypes.ENUM('locked', 'available', 'completed'),
        defaultValue: 'locked',
    },
    stars: { type: DataTypes.INTEGER, defaultValue: 0 },
    scorePct: { type: DataTypes.INTEGER, defaultValue: 0, field: 'score_pct' },
    completedAt: { type: DataTypes.DATE, defaultValue: null, field: 'completed_at' },
}, {
    tableName: 'user_node_progress',
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id', 'node_index'] },
    ],
});

module.exports = UserNodeProgress;
