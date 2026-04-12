require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();
  const u = await User.findOne({ where: { email: 'admin@speedupexam.com' } });
  if (!u) {
    console.log('Admin user not found, creating...');
    await User.create({ name: 'Super Admin', email: 'admin@speedupexam.com', password: 'Admin@SpeedUp2024!', role: 'admin' });
    console.log('Admin created!');
  } else {
    console.log('Current role:', u.role);
    u.role = 'admin';
    await u.save();
    console.log('Fixed! Role is now:', u.role);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
