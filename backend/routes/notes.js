const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getNotes, getNoteById, createNote, updateNote, deleteNote, togglePin, uploadNoteFile, uploadAudioFile, trackView } = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const uniqueName = `audio_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Public audio stream route for <audio> tags (which do not send Authorization headers)
router.get('/audio/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const audioPath = path.join(__dirname, '../uploads/audio', safeFilename);
  if (fs.existsSync(audioPath)) {
    return res.sendFile(audioPath);
  }
  const distAudioPath = path.join(__dirname, '../dist/audio', safeFilename);
  if (fs.existsSync(distAudioPath)) {
    return res.sendFile(distAudioPath);
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

