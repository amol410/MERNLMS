const express = require('express');
const router = express.Router();
const { createTrainer, getUsers, toggleUserActive, deleteUser, updateTrainer } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.post('/trainers', createTrainer);
router.get('/users', getUsers);
router.put('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.put('/trainers/:id', updateTrainer);

module.exports = router;
