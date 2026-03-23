const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote, togglePin } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getNotes).post(createNote);
router.route('/:id').get(getNoteById).put(updateNote).delete(deleteNote);
router.patch('/:id/pin', togglePin);

module.exports = router;
