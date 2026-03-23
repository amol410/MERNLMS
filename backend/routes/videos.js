const express = require('express');
const router = express.Router();
const { getVideos, getVideoById, addVideo, updateVideo, deleteVideo } = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getVideos);
router.get('/:id', getVideoById);
router.post('/', protect, authorize('instructor'), addVideo);
router.put('/:id', protect, authorize('instructor'), updateVideo);
router.delete('/:id', protect, authorize('instructor'), deleteVideo);

module.exports = router;
