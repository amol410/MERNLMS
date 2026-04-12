const { Op } = require('sequelize');
const Flashcard = require('../models/Flashcard');
const FlashcardProgress = require('../models/FlashcardProgress');
const User = require('../models/User');
const mammoth = require('mammoth');
const { generateFlashcardSample } = require('../utils/sampleDocx');

const ownerInclude = { model: User, as: 'ownerUser', attributes: ['id', 'name', 'avatar'] };

// Reshape ownerUser -> owner to match frontend expectations
const reshape = (deck) => {
  const data = deck.toJSON ? deck.toJSON() : deck;
  if (data.ownerUser) {
    data.owner = data.ownerUser;
    delete data.ownerUser;
  }
  return data;
};

exports.getDecks = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    const conditions = [
      { [Op.or]: [{ owner: req.user.id }, { isPublic: true }] },
    ];

    if (q) {
      conditions.push({
        [Op.or]: [
          { deckName: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Flashcard.findAndCountAll({
      where: { [Op.and]: conditions },
      include: [ownerInclude],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, decks: rows.map(reshape), pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

exports.getDeckById = async (req, res, next) => {
  try {
    const deck = await Flashcard.findByPk(req.params.id, { include: [ownerInclude] });
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (!deck.isPublic && deck.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, deck: reshape(deck) });
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
      owner: req.user.id, deckName, description, cards, color, isPublic, tags,
    });
    res.status(201).json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.updateDeck = async (req, res, next) => {
  try {
    const deck = await Flashcard.findByPk(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (deck.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { deckName, description, cards, color, isPublic, tags } = req.body;
    if (deckName !== undefined) deck.deckName = deckName;
    if (description !== undefined) deck.description = description;
    if (cards !== undefined) deck.cards = cards;
    if (color !== undefined) deck.color = color;
    if (isPublic !== undefined) deck.isPublic = isPublic;
    if (tags !== undefined) deck.tags = tags;
    await deck.save();
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.deleteDeck = async (req, res, next) => {
  try {
    const deck = await Flashcard.findByPk(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (deck.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await FlashcardProgress.destroy({ where: { flashcard: deck.id } });
    await deck.destroy();
    res.json({ success: true, message: 'Deck deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const deck = await Flashcard.findByPk(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (deck.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    deck.cards = [...deck.cards, req.body];
    await deck.save();
    res.json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

exports.removeCard = async (req, res, next) => {
  try {
    const deck = await Flashcard.findByPk(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (deck.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    // cardId is the card's array index
    deck.cards = deck.cards.filter((_, i) => String(i) !== req.params.cardId);
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

    let progress = await FlashcardProgress.findOne({
      where: { student: req.user.id, flashcard: req.params.id },
    });

    if (progress) {
      progress.cardResults = cardResults;
      progress.masteredCount = masteredCount;
      progress.lastStudiedAt = new Date();
      progress.sessionCount += 1;
      await progress.save();
    } else {
      progress = await FlashcardProgress.create({
        student: req.user.id,
        flashcard: req.params.id,
        cardResults,
        masteredCount,
        lastStudiedAt: new Date(),
        sessionCount: 1,
      });
    }

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const progress = await FlashcardProgress.findOne({
      where: { student: req.user.id, flashcard: req.params.id },
    });
    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
};

exports.getSampleFormat = async (req, res, next) => {
  try {
    const buffer = await generateFlashcardSample();
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.set('Content-Disposition', 'attachment; filename="flashcard_format.docx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

exports.bulkUploadDeck = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    const deckNameMatch  = text.match(/^DECK_NAME:\s*(.+)/m);
    const descMatch      = text.match(/^DESCRIPTION:\s*(.+)/m);
    const colorMatch     = text.match(/^COLOR:\s*(\w+)/m);

    const deckName    = deckNameMatch ? deckNameMatch[1].trim() : 'Uploaded Deck';
    const description = descMatch     ? descMatch[1].trim()     : '';
    const color       = colorMatch    ? colorMatch[1].trim()    : 'default';

    const cardBlocks = text.split(/\n(?=Q:)/i).filter(b => b.match(/^Q:/i));
    const cards = [];

    for (const block of cardBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const frontMatch = lines[0].match(/^Q:\s*(.+)/i);
      const backLine   = lines.find(l => /^A:/i.test(l));
      const hintLine   = lines.find(l => /^HINT:/i.test(l));

      if (!frontMatch || !backLine) continue;

      const front = frontMatch[1].trim();
      const back  = backLine.replace(/^A:\s*/i, '').trim();
      const hint  = hintLine ? hintLine.replace(/^HINT:\s*/i, '').trim() : '';

      if (front && back) cards.push({ front, back, hint });
    }

    if (cards.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid cards found. Check the file format.' });
    }

    const deck = await Flashcard.create({
      owner: req.user.id,
      deckName, description, color,
      cards,
      isPublic: false,
    });

    res.status(201).json({ success: true, deck, message: `Deck created with ${cards.length} cards` });
  } catch (error) {
    next(error);
  }
};
