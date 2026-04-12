const { Op } = require('sequelize');
const Video = require('../models/Video');
const User = require('../models/User');
const extractYouTubeId = require('../utils/extractYouTubeId');

const addedByInclude = { model: User, as: 'addedByUser', attributes: ['id', 'name', 'avatar'] };

// Reshape addedByUser -> addedBy to match frontend expectations
const reshape = (video) => {
  const data = video.toJSON ? video.toJSON() : video;
  if (data.addedByUser) {
    data.addedBy = data.addedByUser;
    delete data.addedByUser;
  }
  return data;
};

exports.getVideos = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const where = { isPublic: true };

    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    if (tag) {
      where.tags = { [Op.like]: `%"${tag}"%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Video.findAndCountAll({
      where,
      include: [addedByInclude],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      videos: rows.map(reshape),
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id, { include: [addedByInclude] });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    video.viewCount += 1;
    await video.save();

    res.json({ success: true, video: reshape(video) });
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
      addedBy: req.user.id,
      title, description, youtubeUrl, youtubeVideoId, thumbnailUrl, tags, isPublic,
    });

    res.status(201).json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (video.addedBy !== req.user.id) {
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

    const { title, description, youtubeUrl, youtubeVideoId, thumbnailUrl, tags, isPublic } = req.body;
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (youtubeUrl !== undefined) video.youtubeUrl = youtubeUrl;
    if (youtubeVideoId !== undefined) video.youtubeVideoId = youtubeVideoId;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (tags !== undefined) video.tags = tags;
    if (isPublic !== undefined) video.isPublic = isPublic;
    await video.save();

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (video.addedBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await video.destroy();
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
};
