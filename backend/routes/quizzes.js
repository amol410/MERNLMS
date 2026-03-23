const express = require('express');
const router = express.Router();
const {
  getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz,
  submitAttempt, getMyAttempts, getAllAttempts,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getQuizzes);
router.get('/:id', protect, getQuizById);
router.post('/', protect, authorize('instructor'), createQuiz);
router.put('/:id', protect, authorize('instructor'), updateQuiz);
router.delete('/:id', protect, authorize('instructor'), deleteQuiz);
router.post('/:id/attempt', protect, submitAttempt);
router.get('/:id/attempts', protect, getMyAttempts);
router.get('/:id/results', protect, authorize('instructor'), getAllAttempts);

module.exports = router;
