const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { 
  getNotes, getNoteById, createNote, updateNote, deleteNote, 
  togglePin, uploadNoteFile, uploadAudioFile, streamAudioFromDb, trackView 
} = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// In-memory audio upload so buffers are saved directly into MySQL LONGBLOB
const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 1. Permanent audio stream route from MySQL database (supports HTTP 206 Range seeking)
router.get('/audio/db/:id', streamAudioFromDb);

// 2. Legacy disk/static audio fallback route for existing files or demo tracks
router.get('/audio/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const candidates = [
    path.join(__dirname, '../uploads/audio', safeFilename),
    path.join(__dirname, '../dist/audio', safeFilename),
    path.join(__dirname, '../../frontend/public/audio', safeFilename),
    path.join(process.cwd(), 'uploads/audio', safeFilename),
    path.join(process.cwd(), 'backend/uploads/audio', safeFilename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
  }
  res.status(404).send('Audio file not found');
});

router.use(protect);
router.get('/', getNotes);
router.post('/', authorize('trainer', 'admin'), createNote);
router.post('/upload', authorize('trainer', 'admin'), upload.single('file'), uploadNoteFile);
router.post('/upload-audio', authorize('trainer', 'admin'), uploadAudio.single('audio'), uploadAudioFile);
router.get('/:id', getNoteById);
router.put('/:id', authorize('trainer', 'admin'), updateNote);
router.delete('/:id', authorize('trainer', 'admin'), deleteNote);
router.patch('/:id/pin', authorize('trainer', 'admin'), togglePin);
// Engagement tracking — available to all authenticated users
router.post('/:id/track', trackView);

module.exports = router;

