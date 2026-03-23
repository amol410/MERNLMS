const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  front: { type: String, required: true, maxlength: 500 },
  back: { type: String, required: true, maxlength: 1000 },
  hint: { type: String, default: '' },
});

const flashcardSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deckName: { type: String, required: [true, 'Deck name is required'], trim: true, maxlength: 100 },
    description: { type: String, default: '' },
    cards: [cardSchema],
    color: {
      type: String,
      enum: ['default', 'blue', 'green', 'yellow', 'pink', 'purple'],
      default: 'default',
    },
    isPublic: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    cardCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

flashcardSchema.pre('save', function (next) {
  this.cardCount = this.cards.length;
  next();
});

flashcardSchema.index({ owner: 1 });
flashcardSchema.index({ deckName: 'text', description: 'text' });

module.exports = mongoose.model('Flashcard', flashcardSchema);
