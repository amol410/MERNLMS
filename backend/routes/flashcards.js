const express = require('express');
const router = express.Router();
const {
  getDecks, getDeckById, createDeck, updateDeck, deleteDeck,
  addCard, removeCard, saveProgress, getProgress,
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getDecks).post(createDeck);
router.route('/:id').get(getDeckById).put(updateDeck).delete(deleteDeck);
router.post('/:id/cards', addCard);
router.delete('/:id/cards/:cardId', removeCard);
router.route('/:id/progress').get(getProgress).post(saveProgress);

module.exports = router;
