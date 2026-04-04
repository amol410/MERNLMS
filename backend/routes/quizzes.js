const express = require('express');
const router = express.Router();
const {
  getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz,
  submitAttempt, getMyAttempts, getAllAttempts, bulkUploadQuiz,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', getQuizzes);
router.get('/:id', protect, getQuizById);
router.post('/', protect, authorize('trainer', 'admin'), createQuiz);
router.put('/:id', protect, authorize('trainer', 'admin'), updateQuiz);
router.delete('/:id', protect, authorize('trainer', 'admin'), deleteQuiz);
router.post('/:id/attempt', protect, submitAttempt);
router.get('/:id/attempts', protect, getMyAttempts);
router.get('/:id/results', protect, authorize('trainer', 'admin'), getAllAttempts);
router.post('/bulk-upload', protect, authorize('trainer', 'admin'), upload.single('file'), bulkUploadQuiz);

module.exports = router;
