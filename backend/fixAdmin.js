require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();
  const adminEmail = process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? null : 'admin@speedupexam.com');
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : 'Admin@SpeedUp2024!');

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required in production.');
  }

  const u = await User.findOne({ where: { email: adminEmail } });
  if (!u) {
    console.log('Admin user not found, creating...');
    await User.create({ name: 'Super Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    console.log('Admin created!');
  } else {
    console.log('Current role:', u.role);
    u.role = 'admin';
    await u.save();
    console.log('Fixed! Role is now:', u.role);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
