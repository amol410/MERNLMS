const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    youtubeUrl: {
      type: String,
      required: [true, 'YouTube URL is required'],
    },
    youtubeVideoId: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

videoSchema.index({ addedBy: 1 });
videoSchema.index({ youtubeVideoId: 1 });
videoSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Video', videoSchema);
