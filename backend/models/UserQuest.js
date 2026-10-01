const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserQuest = sequelize.define('UserQuest', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    questTitle: { type: DataTypes.STRING(120), allowNull: false, field: 'quest_title' },
    questType: { type: DataTypes.STRING(50), allowNull: false, field: 'quest_type' },
    targetAmount: { type: DataTypes.INTEGER, defaultValue: 1, field: 'target_amount' },
    currentAmount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_amount' },
    rewardPearls: { type: DataTypes.INTEGER, defaultValue: 15, field: 'reward_pearls' },
    rewardXp: { type: DataTypes.INTEGER, defaultValue: 20, field: 'reward_xp' },
    isClaimed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_claimed' },
    questDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'quest_date' },
}, {
    tableName: 'user_quests',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['user_id', 'quest_date'] },
    ],
});

module.exports = UserQuest;
