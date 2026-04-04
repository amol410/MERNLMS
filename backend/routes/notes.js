const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote, togglePin } = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getNotes);
router.post('/', authorize('trainer', 'admin'), createNote);
router.get('/:id', getNoteById);
router.put('/:id', authorize('trainer', 'admin'), updateNote);
router.delete('/:id', authorize('trainer', 'admin'), deleteNote);
router.patch('/:id/pin', authorize('trainer', 'admin'), togglePin);

module.exports = router;
