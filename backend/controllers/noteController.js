const { Op } = require('sequelize');
const Note = require('../models/Note');
const User = require('../models/User');
const mammoth = require('mammoth');

const ownerInclude = { model: User, as: 'ownerUser', attributes: ['id', 'name'] };

// Reshape ownerUser -> owner to match frontend expectations
const reshape = (note) => {
  const data = note.toJSON ? note.toJSON() : note;
  if (data.ownerUser) {
    data.owner = data.ownerUser;
    delete data.ownerUser;
  }
  return data;
};

exports.getNotes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const where = {};

    // Students see all notes; trainers/admins see only their own
    if (req.user.role !== 'student') {
      where.owner = req.user.id;
    }

    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } },
      ];
    }

    if (tag) {
      where.tags = { [Op.like]: `%"${tag}"%` };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Note.findAndCountAll({
      where,
      include: [ownerInclude],
      order: [['isPinned', 'DESC'], ['updatedAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      notes: rows.map(reshape),
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id, { include: [ownerInclude] });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    // Students can read any note; trainers/admins can only read their own
    if (req.user.role !== 'student' && note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, note: reshape(note) });
  } catch (error) {
    next(error);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags, color, isPinned, contentType } = req.body;
    const note = await Note.create({ owner: req.user.id, title, content, tags, color, isPinned, contentType: contentType || 'richtext' });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { title, content, tags, color, isPinned, contentType } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (contentType !== undefined) note.contentType = contentType;
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.uploadNoteFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { title, tags, color, isPinned, noteId } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    let content = '';
    let contentType = '';

    if (ext === 'docx') {
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      content = result.value;
      contentType = 'docx';
    } else if (ext === 'html' || ext === 'htm') {
      content = req.file.buffer.toString('utf8');
      contentType = 'html';
    } else {
      return res.status(400).json({ success: false, message: 'Only .docx and .html files are supported' });
    }

    if (!content.trim()) return res.status(400).json({ success: false, message: 'File appears to be empty' });

    const parsedTags = tags ? JSON.parse(tags) : [];

    if (noteId) {
      // Update existing note
      const note = await Note.findByPk(noteId);
      if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
      if (note.owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
      note.title = title || note.title;
      note.content = content;
      note.contentType = contentType;
      note.tags = parsedTags;
      if (color !== undefined) note.color = color;
      if (isPinned !== undefined) note.isPinned = isPinned === 'true';
      await note.save();
      return res.json({ success: true, note });
    }

    const note = await Note.create({
      owner: req.user.id,
      title: title || 'Uploaded Note',
      content, contentType,
      tags: parsedTags,
      color: color || 'default',
      isPinned: isPinned === 'true',
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await note.destroy();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

exports.togglePin = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    note.isPinned = !note.isPinned;
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};
