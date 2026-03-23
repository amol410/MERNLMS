const Flashcard = require('../models/Flashcard');
const FlashcardProgress = require('../models/FlashcardProgress');

exports.getDecks = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    const query = {
      $or: [{ owner: req.user._id }, { isPublic: true }],
    };
    if (q) query.$text = { $search: q };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [decks, total] = await Promise.all([
      Flashcard.find(query)
        .populate('owner', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Flashcard.countDocuments(query),
    ]);

    res.json({ success: true, decks, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

exports.getDeckById = async (req, res, next) => {
  try {
    const deck = await Flashcard.findById(req.params.id).populate('owner', 'name avatar');
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.isPublic && !deck.owner._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.createDeck = async (req, res, next) => {
  try {
    const { deckName, description, cards, color, isPublic, tags } = req.body;
    if (!cards || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one card is required' });
    }
    const deck = await Flashcard.create({
      owner: req.user._id, deckName, description, cards, color, isPublic, tags,
    });
    res.status(201).json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.updateDeck = async (req, res, next) => {
  try {
    let deck = await Flashcard.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    deck = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.deleteDeck = async (req, res, next) => {
  try {
    const deck = await Flashcard.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await FlashcardProgress.deleteMany({ flashcard: deck._id });
    await deck.deleteOne();
    res.json({ success: true, message: 'Deck deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const deck = await Flashcard.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    deck.cards.push(req.body);
    await deck.save();
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.removeCard = async (req, res, next) => {
  try {
    const deck = await Flashcard.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    deck.cards = deck.cards.filter(c => c._id.toString() !== req.params.cardId);
    await deck.save();
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.saveProgress = async (req, res, next) => {
  try {
    const { cardResults } = req.body;
    const masteredCount = cardResults.filter(r => r.status === 'known').length;

    const progress = await FlashcardProgress.findOneAndUpdate(
      { student: req.user._id, flashcard: req.params.id },
      {
        $set: { cardResults, masteredCount, lastStudiedAt: new Date() },
        $inc: { sessionCount: 1 },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const progress = await FlashcardProgress.findOne({
      student: req.user._id,
      flashcard: req.params.id,
    });
    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};
