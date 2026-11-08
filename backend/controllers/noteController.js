const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Note = require('../models/Note');
const User = require('../models/User');
const Subject = require('../models/Subject');
const UserActivity = require('../models/UserActivity');
const KaraokeAudio = require('../models/KaraokeAudio');
const { getClientDate } = require('../utils/dateHelper');
const mammoth = require('mammoth');
const { sanitizeNoteHtml } = require('../utils/htmlSanitizer');

const ownerInclude = { model: User, as: 'ownerUser', attributes: ['id', 'name'] };
const subjectInclude = { model: Subject, as: 'subject', attributes: ['id', 'name'] };

// Reshape ownerUser -> owner to match frontend expectations
const reshape = (note) => {
  const data = note.toJSON ? note.toJSON() : note;
  if (data.ownerUser) {
    data.owner = data.ownerUser;
    delete data.ownerUser;
  }
  if (!data.audioUrl && data.karaokeData && typeof data.karaokeData === 'object' && data.karaokeData.audioUrl) {
    data.audioUrl = data.karaokeData.audioUrl;
  }
  return data;
};

exports.getNotes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 6, subject, topic, color } = req.query;
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

    if (color) {
      where.color = color;
    }

    if (subject) {
      where.subjectId = parseInt(subject);
    }

    if (topic) {
      where.topic = topic;
    }

    const parsedLimit = parseInt(limit) || 6;
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Note.findAndCountAll({
      where,
      include: [ownerInclude, subjectInclude],
      order: [['isPinned', 'DESC'], ['updatedAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });

    // Extract all distinct tags for the filter bar
    const tagOwnerWhere = req.user.role !== 'student' ? { owner: req.user.id } : {};
    const allNoteTags = await Note.findAll({
      attributes: ['tags'],
      where: tagOwnerWhere,
      raw: true,
    });
    const tagSet = new Set();
    allNoteTags.forEach(n => {
      try {
        const parsed = typeof n.tags === 'string' ? JSON.parse(n.tags) : (Array.isArray(n.tags) ? n.tags : []);
        parsed.forEach(t => t && tagSet.add(t));
      } catch (e) {}
    });

    res.json({
      success: true,
      notes: rows.map(reshape),
      tags: Array.from(tagSet),
      pagination: {
        total: count,
        page: parsedPage,
        pages: Math.ceil(count / parsedLimit) || 1,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id, { include: [ownerInclude, subjectInclude] });
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
    const { title, content, tags, color, isPinned, contentType, subject, topic, isKaraoke, audioUrl, karaokeData } = req.body;
    const cleanContent = content ? sanitizeNoteHtml(content) : '';
    const note = await Note.create({ 
      owner: req.user.id, title, content: cleanContent, tags, color, isPinned, 
      contentType: contentType || 'richtext',
      subjectId: subject || null,
      topic: topic || null,
      isKaraoke: Boolean(isKaraoke),
      audioUrl: audioUrl || null,
      karaokeData: karaokeData || null,
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (req.user.role !== 'admin' && note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { title, content, tags, color, isPinned, contentType, subject, topic, isKaraoke, audioUrl, karaokeData } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = sanitizeNoteHtml(content);
    if (tags !== undefined) note.tags = tags;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (contentType !== undefined) note.contentType = contentType;
    if (subject !== undefined) note.subjectId = subject || null;
    if (topic !== undefined) note.topic = topic || null;
    if (isKaraoke !== undefined) note.isKaraoke = Boolean(isKaraoke);
    if (audioUrl !== undefined) {
      note.audioUrl = audioUrl;
      // Keep karaokeData.audioUrl synchronized
      if (note.karaokeData && typeof note.karaokeData === 'object') {
        const kData = { ...note.karaokeData, audioUrl };
        note.karaokeData = kData;
      }
    }
    if (karaokeData !== undefined) {
      if (karaokeData && typeof karaokeData === 'object') {
        // If incoming karaokeData lacks audioUrl, preserve note's existing audioUrl
        if (!karaokeData.audioUrl && note.audioUrl) {
          karaokeData.audioUrl = note.audioUrl;
        } else if (karaokeData.audioUrl && !note.audioUrl) {
          note.audioUrl = karaokeData.audioUrl;
        }
      }
      note.karaokeData = karaokeData;
    }
    await note.save();
    res.json({ success: true, note: reshape(note) });
  } catch (error) {
    next(error);
  }
};

exports.uploadNoteFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { title, tags, color, isPinned, noteId, subject, topic } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    let content = '';
    let contentType = '';

    if (ext === 'docx') {
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      content = sanitizeNoteHtml(result.value);
      contentType = 'docx';
    } else if (ext === 'html' || ext === 'htm') {
      content = sanitizeNoteHtml(req.file.buffer.toString('utf8'));
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
      if (subject !== undefined) note.subjectId = subject || null;
      if (topic !== undefined) note.topic = topic || null;
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
      subjectId: subject || null,
      topic: topic || null
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

/**
 * POST /api/notes/:id/track
 * Body: { engagementSecs: number, listeningSecs?: number, isKaraoke?: boolean }
 * Logs a note read or karaoke listening activity.
 * Available to all authenticated users (students too).
 */
exports.trackView = async (req, res, next) => {
  try {
    const engagementSecs = parseInt(req.body.engagementSecs) || 0;
    const listeningSecs = parseInt(req.body.listeningSecs) || 0;
    const isKaraokeParam = Boolean(req.body.isKaraoke);

    const isDemo = req.params.id === 'demo' || req.params.id === '0';
    const isKaraokeReq = isKaraokeParam || isDemo;

    // For regular notes: 180s (3m) threshold.
    // For karaoke notes: 15s listening/practice threshold so every story session counts!
    const effectiveSecs = isKaraokeReq ? Math.max(engagementSecs, listeningSecs) : engagementSecs;
    const minThreshold = isKaraokeReq ? 15 : 180;

    if (effectiveSecs < minThreshold) {
      return res.json({ success: true, logged: false, reason: 'below_threshold' });
    }

    let resourceId = 0;
    let resourceTitle = 'Interactive Karaoke Story';
    let subjectName = 'German';
    let topicName = 'Reading Practice';
    let isKaraokeNote = isKaraokeReq;

    if (!isDemo) {
      const note = await Note.findByPk(req.params.id, { include: [subjectInclude] });
      if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
      resourceId = note.id;
      resourceTitle = note.title;
      subjectName = note.subject?.name || null;
      topicName = note.topic || null;
      if (note.isKaraoke) isKaraokeNote = true;
    }

    const todayYMD = getClientDate(req);
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note',
      resourceId,
      resourceTitle,
      subjectName,
      topicName,
      metadata: {
        engagementSecs: effectiveSecs,
        listeningSecs: isKaraokeNote ? (listeningSecs || effectiveSecs) : 0,
        isKaraoke: isKaraokeNote,
      },
      activityDate: todayYMD,
    });

    if (isKaraokeNote) {
      try {
        const UserQuest = require('../models/UserQuest');
        const karaokeQuest = await UserQuest.findOne({
          where: { userId: req.user.id, questType: 'karaoke', questDate: todayYMD, isClaimed: false }
        });
        if (karaokeQuest) {
          karaokeQuest.currentAmount = Math.min(karaokeQuest.targetAmount, (karaokeQuest.currentAmount || 0) + 1);
          await karaokeQuest.save();
        }
      } catch (qErr) {
        // non-blocking quest update
      }
    }

    res.json({ success: true, logged: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notes/upload-audio
 * Accepts audio file and saves directly into MySQL `karaoke_audios` table as LONGBLOB
 * Returns permanent URL `/api/notes/audio/db/:id`
 */
exports.uploadAudioFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    const buffer = req.file.buffer || (req.file.path ? require('fs').readFileSync(req.file.path) : null);
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Audio file buffer is empty' });
    }

    const noteId = req.body.noteId ? parseInt(req.body.noteId) : null;

    // Save permanently in MySQL database
    const audioRecord = await KaraokeAudio.create({
      noteId,
      filename: req.file.originalname || 'karaoke_story.mp3',
      mimeType: req.file.mimetype || 'audio/mpeg',
      audioData: buffer,
      fileSize: buffer.length,
    });

    const audioUrl = `/api/notes/audio/db/${audioRecord.id}`;

    // If noteId was supplied, update the note in database right away
    if (noteId) {
      const note = await Note.findByPk(noteId);
      if (note) {
        note.audioUrl = audioUrl;
        if (note.karaokeData && typeof note.karaokeData === 'object') {
          note.karaokeData = { ...note.karaokeData, audioUrl };
        }
        await note.save();
      }
    }

    res.json({
      success: true,
      audioUrl,
      audioId: audioRecord.id,
      filename: req.file.originalname,
      fileSize: buffer.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notes/audio/db/:id
 * Streams audio binary data directly from MySQL table `karaoke_audios`
 * Supports HTTP 206 Partial Content (Range requests) with memory-safe SQL SUBSTR byte-slicing
 */
exports.streamAudioFromDb = async (req, res, next) => {
  try {
    const audioId = parseInt(req.params.id, 10);
    if (isNaN(audioId) || audioId <= 0) {
      return res.status(400).send('Invalid audio ID');
    }

    // 1. Fetch metadata & length only (does NOT load entire LONGBLOB into RAM)
    const metaList = await sequelize.query(
      'SELECT id, mimeType, LENGTH(audioData) AS totalLength FROM karaoke_audios WHERE id = :id LIMIT 1',
      {
        replacements: { id: audioId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!metaList || metaList.length === 0 || !metaList[0].totalLength) {
      return res.status(404).send('Audio track not found in database');
    }

    const meta = metaList[0];
    const totalLength = Number(meta.totalLength);
    const contentType = meta.mimeType || 'audio/mpeg';

    const range = req.headers.range;
    if (range) {
      // Parse Range header e.g. "bytes=0-" or "bytes=1000-2000"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength || start > end) {
        res.setHeader('Content-Range', `bytes */${totalLength}`);
        return res.status(416).send('Requested Range Not Satisfiable');
      }

      const chunkSize = (end - start) + 1;

      // 2. Stream ONLY the requested byte slice directly from SQL using SUBSTR (1-indexed)
      const chunkRows = await sequelize.query(
        'SELECT SUBSTR(audioData, :startOneIndexed, :chunkSize) AS chunk FROM karaoke_audios WHERE id = :id LIMIT 1',
        {
          replacements: {
            id: audioId,
            startOneIndexed: start + 1,
            chunkSize,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const chunkBuffer = chunkRows && chunkRows[0] && chunkRows[0].chunk;
      if (!chunkBuffer) {
        return res.status(500).send('Error reading audio range');
      }

      const finalChunk = Buffer.isBuffer(chunkBuffer) ? chunkBuffer : Buffer.from(chunkBuffer);
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': finalChunk.length,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      });
      return res.end(finalChunk);
    }

    // Full audio request
    const fullAudioRows = await sequelize.query(
      'SELECT audioData FROM karaoke_audios WHERE id = :id LIMIT 1',
      {
        replacements: { id: audioId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const fullBuffer = fullAudioRows && fullAudioRows[0] && fullAudioRows[0].audioData;
    const finalBuffer = Buffer.isBuffer(fullBuffer) ? fullBuffer : Buffer.from(fullBuffer || '');

    res.writeHead(200, {
      'Content-Length': finalBuffer.length,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    });
    return res.end(finalBuffer);
  } catch (error) {
    console.error('Error streaming audio from DB:', error);
    res.status(500).send('Error streaming audio from database');
  }
};

