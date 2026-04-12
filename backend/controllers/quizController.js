const { Op } = require('sequelize');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const mammoth = require('mammoth');
const { generateQuizSample } = require('../utils/sampleDocx');

const createdByInclude = { model: User, as: 'createdByUser', attributes: ['id', 'name', 'avatar'] };

// Reshape createdByUser -> createdBy to match frontend expectations
const reshape = (quiz) => {
  const data = quiz.toJSON ? quiz.toJSON() : quiz;
  if (data.createdByUser) {
    data.createdBy = data.createdByUser;
    delete data.createdByUser;
  }
  return data;
};

// Assign index-based _id to each question so frontend can identify them
const assignQuestionIds = (questions) =>
  questions.map((q, i) => ({ _id: i, ...q }));

exports.getQuizzes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const isStaff = req.user?.role === 'trainer' || req.user?.role === 'admin';
    const where = isStaff
      ? { [Op.or]: [{ isPublished: true }, { createdBy: req.user.id }] }
      : { isPublished: true };

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
    const { count, rows } = await Quiz.findAndCountAll({
      where,
      include: [createdByInclude],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    // Strip correct answers for list view
    const quizzes = rows.map(quiz => {
      const data = reshape(quiz);
      data.questions = data.questions.map(({ correctIndex, explanation, ...rest }) => rest);
      return data;
    });

    res.json({ success: true, quizzes, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, { include: [createdByInclude] });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isOwner = req.user && quiz.createdBy === req.user.id;
    const data = reshape(quiz);

    if (!isOwner) {
      data.questions = data.questions.map(({ correctIndex, explanation, ...q }) => q);
    }

    res.json({ success: true, quiz: data });
  } catch (error) {
    next(error);
  }
};

exports.createQuiz = async (req, res, next) => {
  try {
    const { title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required' });
    }

    const quiz = await Quiz.create({
      createdBy: req.user.id,
      title, description,
      questions: assignQuestionIds(questions),
      passingScore, timeLimit, shuffleQuestions, isPublished, tags,
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = assignQuestionIds(questions);
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (shuffleQuestions !== undefined) quiz.shuffleQuestions = shuffleQuestions;
    if (isPublished !== undefined) quiz.isPublished = isPublished;
    if (tags !== undefined) quiz.tags = tags;
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await QuizAttempt.destroy({ where: { quizId: quiz.id } });
    await quiz.destroy();
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    next(error);
  }
};

exports.submitAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const { answers, startedAt, timeTakenSecs } = req.body;

    // Check attempt limit
    if (quiz.attemptLimit) {
      const attemptCount = await QuizAttempt.count({ where: { quizId: quiz.id, studentId: req.user.id } });
      if (attemptCount >= quiz.attemptLimit) {
        return res.status(400).json({ success: false, message: 'Attempt limit reached' });
      }
    }

    const attemptNumber = await QuizAttempt.count({ where: { quizId: quiz.id, studentId: req.user.id } }) + 1;

    // Grade answers — match by question._id (index assigned at creation)
    const gradedAnswers = quiz.questions.map((question, index) => {
      const submittedAnswer = answers.find(a => String(a.questionId) === String(question._id ?? index));
      const chosenIndex = submittedAnswer ? submittedAnswer.chosenIndex : -1;
      const isCorrect = chosenIndex === question.correctIndex;
      return {
        questionId: question._id ?? index,
        chosenIndex,
        isCorrect,
        pointsEarned: isCorrect ? (question.points || 1) : 0,
      };
    });

    const score = gradedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const maxScore = quiz.totalPoints || gradedAnswers.reduce((sum, _, i) => sum + (quiz.questions[i]?.points || 1), 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      quizId: quiz.id,
      studentId: req.user.id,
      answers: gradedAnswers,
      score, maxScore, percentage, passed, attemptNumber,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      submittedAt: new Date(),
      timeTakenSecs,
    });

    const result = {
      attempt,
      questions: quiz.questions.map((q, i) => ({
        _id: q._id ?? i,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        chosenIndex: gradedAnswers[i].chosenIndex,
        isCorrect: gradedAnswers[i].isCorrect,
        pointsEarned: gradedAnswers[i].pointsEarned,
      })),
    };

    res.status(201).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.findAll({
      where: { quizId: req.params.id, studentId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttempts = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (req.user.role !== 'admin' && quiz.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const attempts = await QuizAttempt.findAll({
      where: { quizId: req.params.id },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

exports.bulkUploadQuiz = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    const titleMatch    = text.match(/^TITLE:\s*(.+)/m);
    const descMatch     = text.match(/^DESCRIPTION:\s*(.+)/m);
    const passingMatch  = text.match(/^PASSING_SCORE:\s*(\d+)/m);
    const timeLimitMatch= text.match(/^TIME_LIMIT:\s*(\d+)/m);
    const tagsMatch     = text.match(/^TAGS:\s*(.+)/m);

    const title       = titleMatch    ? titleMatch[1].trim()    : 'Uploaded Quiz';
    const description = descMatch     ? descMatch[1].trim()     : '';
    const passingScore= passingMatch  ? parseInt(passingMatch[1]): 70;
    const timeLimit   = timeLimitMatch? parseInt(timeLimitMatch[1]): 0;
    const tags        = tagsMatch     ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];

    const questionBlocks = text.split(/\n(?=Q\d*:|\nQ\d*:)/i).filter(b => b.match(/^Q\d*:/i));
    const questions = [];

    for (const block of questionBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const qLineMatch = lines[0].match(/^Q\d*:\s*(.+)/i);
      if (!qLineMatch) continue;
      const qText = qLineMatch[1].trim();

      const isTrueFalse = lines.some(l => /^TRUE_FALSE$/i.test(l));
      let options = [], correctIndex = 0, explanation = '', points = 1;

      if (isTrueFalse) {
        options = ['True', 'False'];
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          correctIndex = answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase() === 'TRUE' ? 0 : 1;
        }
      } else {
        const optionLines = lines.filter(l => /^[A-D]\)/i.test(l));
        options = optionLines.map(l => l.replace(/^[A-D]\)\s*/i, '').trim());
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          const idx = ['A', 'B', 'C', 'D'].indexOf(answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase());
          correctIndex = idx >= 0 ? idx : 0;
        }
      }

      const explanationLine = lines.find(l => /^EXPLANATION:/i.test(l));
      if (explanationLine) explanation = explanationLine.replace(/^EXPLANATION:/i, '').trim();

      const pointsLine = lines.find(l => /^POINTS:/i.test(l));
      if (pointsLine) points = parseInt(pointsLine.replace(/^POINTS:/i, '').trim()) || 1;

      if (options.length >= 2) {
        questions.push({ text: qText, type: isTrueFalse ? 'true-false' : 'multiple-choice', options, correctIndex, explanation, points });
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found. Check the file format.' });
    }

    const quiz = await Quiz.create({
      createdBy: req.user.id,
      title, description,
      questions: assignQuestionIds(questions),
      passingScore, timeLimit, tags,
      isPublished: true,
    });

    res.status(201).json({ success: true, quiz, message: `Quiz created with ${questions.length} questions` });
  } catch (error) {
    next(error);
  }
};

exports.getSampleFormat = async (req, res, next) => {
  try {
    const buffer = await generateQuizSample();
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.set('Content-Disposition', 'attachment; filename="quiz_format.docx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
