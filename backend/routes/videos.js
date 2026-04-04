const express = require('express');
const router = express.Router();
const { getVideos, getVideoById, addVideo, updateVideo, deleteVideo } = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getVideos);
router.get('/:id', getVideoById);
router.post('/', protect, authorize('trainer', 'admin'), addVideo);
router.put('/:id', protect, authorize('trainer', 'admin'), updateVideo);
router.delete('/:id', protect, authorize('trainer', 'admin'), deleteVideo);

module.exports = router;
