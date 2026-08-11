const express = require('express');
const router = express.Router();
const {
  getSubjects, createSubject, addTopic, deleteSubject, deleteTopic,
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');

// Public read
router.get('/', getSubjects);

// Create subject — trainer or admin
router.post('/', protect, authorize('trainer', 'admin'), createSubject);

// Add topic to subject — trainer or admin
router.post('/:id/topics', protect, authorize('trainer', 'admin'), addTopic);

// Delete subject — admin only
router.delete('/:id', protect, authorize('admin'), deleteSubject);

// Delete topic — admin only
router.delete('/:id/topics/:topicId', protect, authorize('admin'), deleteTopic);

module.exports = router;
