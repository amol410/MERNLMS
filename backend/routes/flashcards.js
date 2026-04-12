const express = require('express');
const router = express.Router();
const {
  getDecks, getDeckById, createDeck, updateDeck, deleteDeck,
  addCard, removeCard, saveProgress, getProgress,
  bulkUploadDeck,
} = require('../controllers/flashcardController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);
router.post('/bulk-upload', authorize('trainer', 'admin'), upload.single('file'), bulkUploadDeck);
router.get('/', getDecks);
router.post('/', authorize('trainer', 'admin'), createDeck);
router.get('/:id', getDeckById);
router.put('/:id', authorize('trainer', 'admin'), updateDeck);
router.delete('/:id', authorize('trainer', 'admin'), deleteDeck);
router.post('/:id/cards', authorize('trainer', 'admin'), addCard);
router.delete('/:id/cards/:cardId', authorize('trainer', 'admin'), removeCard);
router.route('/:id/progress').get(getProgress).post(saveProgress);

module.exports = router;
