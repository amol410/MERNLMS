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
router.post('/', createDeck);
router.get('/:id', getDeckById);
router.put('/:id', updateDeck);
router.delete('/:id', deleteDeck);
router.post('/:id/cards', addCard);
router.delete('/:id/cards/:cardId', removeCard);
router.route('/:id/progress').get(getProgress).post(saveProgress);

module.exports = router;
