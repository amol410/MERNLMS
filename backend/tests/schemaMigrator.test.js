const { Sequelize, DataTypes } = require('sequelize');
const { autoMigrateColumns, selfHealingDatabaseSync, pruneDuplicateIndexes, migrateUserVerificationColumns, migrateUserFcmTokenColumn, runAllMigrations } = require('../utils/schemaMigrator');

describe('Self-Healing Additive Schema Migrator Suite', () => {
    let testSequelize;

    beforeEach(async () => {
        testSequelize = new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
        });
    });

    afterEach(async () => {
        await testSequelize.close();
    });

    it('creates base tables and safely auto-migrates missing columns without data loss', async () => {
        // 1. Define model with initial 2 fields
        const Item = testSequelize.define('Item', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: DataTypes.STRING, allowNull: false },
        }, { tableName: 'items', timestamps: false });

        await testSequelize.sync();

        // Insert initial test record
        await Item.create({ title: 'Initial Item' });

        // 2. Now simulate a developer adding a new column 'extraDescription' to the model in code
        Item.rawAttributes.extraDescription = {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'default_extra',
            field: 'extraDescription',
        };

        // 3. Run autoMigrateColumns
        await autoMigrateColumns(testSequelize);

        // 4. Verify the new column was added to SQLite and existing record is preserved
        const qi = testSequelize.getQueryInterface();
        const tableDesc = await qi.describeTable('items');
        expect(tableDesc.extraDescription).toBeDefined();

        // 5. Existing record is intact
        const items = await Item.findAll();
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Initial Item');
    });

    it('is strictly additive: never drops existing columns when removed from model definition', async () => {
        const Profile = testSequelize.define('Profile', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            username: { type: DataTypes.STRING, allowNull: false },
            legacyData: { type: DataTypes.STRING, allowNull: true },
        }, { tableName: 'profiles', timestamps: false });

        await testSequelize.sync();
        await Profile.create({ username: 'user1', legacyData: 'critical_legacy_info' });

        // Simulate developer removing 'legacyData' from JavaScript model definition
        delete Profile.rawAttributes.legacyData;

        // Run autoMigrateColumns
        await autoMigrateColumns(testSequelize);

        // Verify 'legacyData' column was NOT dropped from the database
        const qi = testSequelize.getQueryInterface();
        const tableDesc = await qi.describeTable('profiles');
        expect(tableDesc.legacyData).toBeDefined();

        // Verify data was not lost
        const [rows] = await testSequelize.query('SELECT username, legacyData FROM profiles');
        expect(rows).toHaveLength(1);
        expect(rows[0].legacyData).toBe('critical_legacy_info');
    });

    it('selfHealingDatabaseSync completes cleanly in test environment without errors', async () => {
        await expect(selfHealingDatabaseSync(testSequelize)).resolves.not.toThrow();
    });

    it('pruneDuplicateIndexes handles non-MySQL dialects safely without crashing', async () => {
        await expect(pruneDuplicateIndexes(testSequelize, 'items')).resolves.not.toThrow();
    });

    it('migrateUserVerificationColumns safely adds verification columns and defaults existing accounts to verified', async () => {
        const UserMock = testSequelize.define('User', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            email: { type: DataTypes.STRING, allowNull: false },
        }, { tableName: 'users', timestamps: false });

        await testSequelize.sync();
        await UserMock.create({ email: 'legacy_user@example.com' });

        await migrateUserVerificationColumns(testSequelize);

        const qi = testSequelize.getQueryInterface();
        const tableDesc = await qi.describeTable('users');
        expect(tableDesc.is_email_verified).toBeDefined();
        expect(tableDesc.verification_otp).toBeDefined();
        expect(tableDesc.verification_otp_expires).toBeDefined();

        const [rows] = await testSequelize.query('SELECT is_email_verified FROM users WHERE email = "legacy_user@example.com"');
        expect(rows[0].is_email_verified).toBeTruthy();
    });

    it('migrateUserFcmTokenColumn safely adds fcm_token column without data loss', async () => {
        const UserMock = testSequelize.define('User', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            email: { type: DataTypes.STRING, allowNull: false },
        }, { tableName: 'users', timestamps: false });

        await testSequelize.sync();
        await UserMock.create({ email: 'fcm_user@example.com' });

        await migrateUserFcmTokenColumn(testSequelize);

        const qi = testSequelize.getQueryInterface();
        const tableDesc = await qi.describeTable('users');
        expect(tableDesc.fcm_token).toBeDefined();

        const [rows] = await testSequelize.query('SELECT email, fcm_token FROM users WHERE email = "fcm_user@example.com"');
        expect(rows).toHaveLength(1);
        expect(rows[0].email).toBe('fcm_user@example.com');
        expect(rows[0].fcm_token).toBeNull();
    });

    it('runAllMigrations runs all migrations cleanly without throwing', async () => {
        await expect(runAllMigrations(testSequelize)).resolves.not.toThrow();
    });
});
