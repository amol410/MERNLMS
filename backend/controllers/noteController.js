const Note = require('../models/Note');

exports.getNotes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    // Students see all notes; trainers/admins see their own notes
    const query = req.user.role === 'student' ? {} : { owner: req.user._id };

    if (q) query.$text = { $search: q };
    if (tag) query.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notes, total] = await Promise.all([
      Note.find(query)
        .populate('owner', 'name')
        .sort({ isPinned: -1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Note.countDocuments(query),
    ]);

    res.json({
      success: true,
      notes,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate('owner', 'name');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    // Students can read any note; trainers/admins can only read their own
    if (req.user.role !== 'student' && !note.owner._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags, color } = req.body;
    const note = await Note.create({ owner: req.user._id, title, content, tags, color });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!note.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!note.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

exports.togglePin = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (!note.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    note = await Note.findByIdAndUpdate(req.params.id, { isPinned: !note.isPinned }, { new: true });
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};
