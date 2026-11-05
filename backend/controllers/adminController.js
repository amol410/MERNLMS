const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const DEFAULT_APP_VERSION = {
  min_required_version: 29,
  min_version_name: '1.4.3',
  latest_version_name: '1.4.3',
  update_url: 'https://play.google.com/store/apps/details?id=com.dolphincoder.lms',
  title: 'Critical Security Update',
  message: 'Please update to v1.4.3 immediately to continue learning.',
};

const getVersionFilePath = () => path.join(__dirname, '../app_version.json');

exports.getAppVersion = async (req, res, next) => {
  try {
    const versionFile = getVersionFilePath();
    if (fs.existsSync(versionFile)) {
      const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      return res.json({ success: true, version: data });
    }
    return res.json({ success: true, version: DEFAULT_APP_VERSION });
  } catch (error) {
    next(error);
  }
};

exports.updateAppVersion = async (req, res, next) => {
  try {
    const {
      min_required_version,
      min_version_name,
      latest_version_name,
      update_url,
      title,
      message,
    } = req.body;

    const currentVersionFile = getVersionFilePath();
    let currentData = DEFAULT_APP_VERSION;
    if (fs.existsSync(currentVersionFile)) {
      try {
        currentData = JSON.parse(fs.readFileSync(currentVersionFile, 'utf8'));
      } catch (_) {}
    }

    const updatedData = {
      min_required_version: min_required_version !== undefined ? parseInt(min_required_version, 10) : currentData.min_required_version,
      min_version_name: min_version_name ? String(min_version_name).trim() : (currentData.min_version_name || '1.4.3'),
      latest_version_name: latest_version_name ? String(latest_version_name).trim() : (currentData.latest_version_name || '1.4.3'),
      update_url: update_url ? String(update_url).trim() : (currentData.update_url || 'https://play.google.com/store/apps/details?id=com.dolphincoder.lms'),
      title: title ? String(title).trim() : (currentData.title || 'Update Required'),
      message: message ? String(message).trim() : (currentData.message || 'A newer version of DolphinCoder is available on Google Play. Please update to continue.'),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user ? req.user.email : 'admin',
    };

    // Save to backend/app_version.json
    fs.writeFileSync(currentVersionFile, JSON.stringify(updatedData, null, 2), 'utf8');

    // Also sync to frontend/public/app_version.json if directory exists
    const frontendPublicPath = path.join(__dirname, '../../frontend/public/app_version.json');
    if (fs.existsSync(path.dirname(frontendPublicPath))) {
      try {
        fs.writeFileSync(frontendPublicPath, JSON.stringify(updatedData, null, 2), 'utf8');
      } catch (_) {}
    }

    res.json({
      success: true,
      message: `Version gate successfully updated to build ${updatedData.min_required_version}`,
      version: updatedData,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTrainer = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    const trainer = await User.create({ name, email, password, role: 'trainer', isEmailVerified: true });
    res.status(201).json({
      success: true,
      user: { _id: trainer.id, name: trainer.name, email: trainer.email, role: trainer.role, isActive: trainer.isActive, isEmailVerified: trainer.isEmailVerified, createdAt: trainer.createdAt },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });
    res.json({ success: true, users, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: { _id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

exports.updateTrainer = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'trainer') return res.status(403).json({ success: false, message: 'Can only update trainers' });
    const { name, email, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    await user.save();
    res.json({ success: true, user: { _id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) {
    next(error);
  }
};
