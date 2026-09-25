const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KaraokeAudio = sequelize.define('KaraokeAudio', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    noteId: { 
        type: DataTypes.INTEGER, 
        defaultValue: null, 
        allowNull: true 
    },
    filename: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    mimeType: { 
        type: DataTypes.STRING(100), 
        defaultValue: 'audio/mpeg' 
    },
    audioData: { 
        type: DataTypes.BLOB('long'), 
        allowNull: false 
    },
    fileSize: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
}, { 
    tableName: 'karaoke_audios', 
    timestamps: true 
});

module.exports = KaraokeAudio;
