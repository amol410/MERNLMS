# Post-Migration Fix: Revert `alter: true` to `force: false`

## What was changed
In `backend/config/database.js`, the Sequelize sync was temporarily changed from `force: false` to `alter: true` to add the `contentType` column to the `notes` table.

## Why it needs to be reverted
`alter: true` runs on every server restart and checks/modifies all table structures. This slows down startup and is unnecessary once the migration is done.

## Steps to fix

1. Open `backend/config/database.js`

2. Find this line:
   ```js
   await sequelize.sync({ alter: true });
   ```

3. Change it back to:
   ```js
   await sequelize.sync({ force: false });
   ```

4. Push to production:
   ```bash
   git add backend/config/database.js
   git commit -m "Revert sync to force: false after contentType column migration"
   git push
   ```

5. Restart backend on Hostinger.

## When to do this
After confirming that notes with DOCX and HTML upload are working correctly in production.
