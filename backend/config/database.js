const { Sequelize } = require('sequelize');

// Support MongoDB-style instance._id and toJSON() without generating invalid SQL VIRTUAL column
Object.defineProperty(Sequelize.Model.prototype, '_id', {
    get() { return this.id; },
    configurable: true,
});

const origToJSON = Sequelize.Model.prototype.toJSON;
Sequelize.Model.prototype.toJSON = function() {
    const values = origToJSON ? origToJSON.call(this) : { ...this.get() };
    if (this.id !== undefined && values._id === undefined) {
        values._id = this.id;
    }
    return values;
};

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected:', process.env.DB_HOST);
        await sequelize.sync({ alter: true });
        console.log('✅ All tables synced');
    } catch (error) {
        console.error('❌ MySQL Error:', error.message);
        // Removed process.exit(1) — app will keep running even if DB fails
    }
};

module.exports = { sequelize, connectDB };
