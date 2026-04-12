const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote, togglePin, uploadNoteFile } = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(protect);
router.get('/', getNotes);
router.post('/', authorize('trainer', 'admin'), createNote);
router.post('/upload', authorize('trainer', 'admin'), upload.single('file'), uploadNoteFile);
router.get('/:id', getNoteById);
router.put('/:id', authorize('trainer', 'admin'), updateNote);
router.delete('/:id', authorize('trainer', 'admin'), deleteNote);
router.patch('/:id/pin', authorize('trainer', 'admin'), togglePin);

module.exports = router;
