const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Flashcard = sequelize.define('Flashcard', {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    owner:       { type: DataTypes.INTEGER, allowNull: false },
    deckName:    { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    cards: {
          type: DataTypes.TEXT('long'), defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('cards')); } catch(e) { return []; } },
          set(val) { this.setDataValue('cards', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    color: {
          type: DataTypes.ENUM('default','blue','green','yellow','pink','purple'),
          defaultValue: 'default'
    },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
    tags: {
          type: DataTypes.TEXT, defaultValue: '[]',
          get() { try { return JSON.parse(this.getDataValue('tags')); } catch(e) { return []; } },
          set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); }
    },
    cardCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'flashcards', timestamps: true });

Flashcard.beforeSave((instance) => {
    const cards = instance.cards;
    instance.cardCount = Array.isArray(cards) ? cards.length : 0;
});

module.exports = Flashcard;
