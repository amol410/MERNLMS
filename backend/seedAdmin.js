const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/database');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@speedupexam.com';
const ADMIN_PASSWORD = 'Admin@SpeedUp2024!';
const ADMIN_NAME = 'Super Admin';

async function seed() {
  await connectDB();

  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    process.exit(0);
  }

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });

  console.log('Admin created successfully!');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
