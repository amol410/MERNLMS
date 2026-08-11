const Subject = require('../models/Subject');

// GET /api/subjects — list all subjects with topics
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects — create new subject
exports.createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const existing = await Subject.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject already exists', subject: existing });
    }

    const subject = await Subject.create({ name: name.trim(), topics: [], createdBy: req.user._id });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects/:id/topics — add a topic to a subject
exports.addTopic = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const exists = subject.topics.some(t => t.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, message: 'Topic already exists in this subject', subject });
    }

    subject.topics.push({ name: name.trim() });
    await subject.save();

    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/subjects/:id — delete a subject
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await subject.deleteOne();
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/subjects/:id/topics/:topicId — delete a topic from a subject
exports.deleteTopic = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    subject.topics = subject.topics.filter(t => t._id.toString() !== req.params.topicId);
    await subject.save();

    res.json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};
