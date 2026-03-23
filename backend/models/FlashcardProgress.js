const mongoose = require('mongoose');

const flashcardProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flashcard: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', required: true },
    cardResults: [
      {
        cardId: mongoose.Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ['unseen', 'known', 'unknown', 'reviewing'],
          default: 'unseen',
        },
        lastReviewedAt: Date,
        reviewCount: { type: Number, default: 0 },
      },
    ],
    sessionCount: { type: Number, default: 0 },
    masteredCount: { type: Number, default: 0 },
    lastStudiedAt: Date,
  },
  { timestamps: true }
);

flashcardProgressSchema.index({ student: 1, flashcard: 1 }, { unique: true });

module.exports = mongoose.model('FlashcardProgress', flashcardProgressSchema);
