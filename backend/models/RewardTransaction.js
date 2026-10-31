const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RewardTransaction = sequelize.define('RewardTransaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
    },
    kind: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    reference: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    xpEarned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'xp_earned',
    },
    pearlsEarned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'pearls_earned',
    },
    oxygenEarned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'oxygen_earned',
    },
    responseBody: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'response_body',
        get() {
            const value = this.getDataValue('responseBody');
            try { return JSON.parse(value); } catch (_) { return null; }
        },
        set(value) {
            this.setDataValue('responseBody', JSON.stringify(value));
        },
    },
}, {
    tableName: 'reward_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'kind', 'reference'],
            name: 'unique_user_reward_reference',
        },
        {
            fields: ['user_id', 'kind', 'created_at'],
            name: 'idx_user_reward_created',
        },
    ],
});

module.exports = RewardTransaction;
