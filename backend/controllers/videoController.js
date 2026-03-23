const Video = require('../models/Video');
const extractYouTubeId = require('../utils/extractYouTubeId');

exports.getVideos = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const query = { isPublic: true };

    if (q) query.$text = { $search: q };
    if (tag) query.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate('addedBy', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Video.countDocuments(query),
    ]);

    res.json({
      success: true,
      videos,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('addedBy', 'name avatar');

    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

exports.addVideo = async (req, res, next) => {
  try {
    const { title, description, youtubeUrl, tags, isPublic } = req.body;

    const youtubeVideoId = extractYouTubeId(youtubeUrl);
    if (!youtubeVideoId) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

    const video = await Video.create({
      addedBy: req.user._id,
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      thumbnailUrl,
      tags,
      isPublic,
    });

    res.status(201).json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    let video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (!video.addedBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.body.youtubeUrl) {
      const youtubeVideoId = extractYouTubeId(req.body.youtubeUrl);
      if (!youtubeVideoId) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
      }
      req.body.youtubeVideoId = youtubeVideoId;
      req.body.thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    }

    video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (!video.addedBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await video.deleteOne();
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
};
