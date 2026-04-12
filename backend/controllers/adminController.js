const User = require('../models/User');

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
    const trainer = await User.create({ name, email, password, role: 'trainer' });
    res.status(201).json({
      success: true,
      user: { _id: trainer.id, name: trainer.name, email: trainer.email, role: trainer.role, isActive: trainer.isActive, createdAt: trainer.createdAt },
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
