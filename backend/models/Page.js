const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Page = sequelize.define('Page', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    content: {
        type: DataTypes.TEXT('long'),
        defaultValue: '',
    },
    summary: {
        type: DataTypes.TEXT,
        defaultValue: null,
        allowNull: true,
    },
    featuredImage: {
        type: DataTypes.STRING(500),
        defaultValue: null,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('draft', 'published'),
        defaultValue: 'draft',
    },
    publishedAt: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
    },
}, {
    tableName: 'pages',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['status'] },
    ],
});

// Auto-sync table if not yet present in production database
if (process.env.NODE_ENV !== 'test') {
    Page.sync({ alter: true }).catch((err) => {
        console.log('Notice: Page table auto-sync:', err.message);
    });
}

module.exports = Page;
