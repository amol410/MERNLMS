const { Op } = require('sequelize');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const Subject = require('../models/Subject');
const mammoth = require('mammoth');

const createdByInclude = { model: User, as: 'createdByUser', attributes: ['id', 'name', 'avatar'] };
const subjectInclude = { model: Subject, as: 'subject', attributes: ['id', 'name'] };

// Reshape createdByUser -> createdBy to match frontend expectations
const reshape = (quiz) => {
  const data = quiz.toJSON ? quiz.toJSON() : quiz;
  if (data.createdByUser) {
    data.createdBy = data.createdByUser;
    delete data.createdByUser;
  }
  return data;
};

// Helper function to shuffle an array with derangement (no element stays at its original index if possible)
const shuffleDeranged = (arr) => {
  if (!Array.isArray(arr) || arr.length <= 1) return [...(arr || [])];
  const n = arr.length;
  let shuffled;
  let attempts = 0;
  do {
    shuffled = [...arr];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (attempts < 25 && shuffled.some((item, idx) => item === arr[idx]));

  // Fallback cyclic shift if derangement wasn't achieved (e.g. duplicate values)
  if (shuffled.some((item, idx) => item === arr[idx])) {
    shuffled = arr.map((_, i) => arr[(i + 1) % n]);
  }
  return shuffled;
};

// Sanitize a question for students (strip answers, explanations, and decouple match-pairs)
const sanitizeQuestionForStudent = (q) => {
  const { correctIndex, explanation, ...rest } = q;
  if (q.type === 'match-pairs' && Array.isArray(q.pairs)) {
    const { pairs, ...sanitized } = rest;
    return {
      ...sanitized,
      leftItems: q.pairs.map(p => p.left),
      rightItems: shuffleDeranged(q.pairs.map(p => p.right)),
    };
  }
  return rest;
};

// Assign index-based _id to each question so frontend can identify them
const assignQuestionIds = (questions) =>
  questions.map((q, i) => ({ _id: i, ...q }));

exports.getQuizzes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12, subject, topic } = req.query;
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

    if (subject) {
      where.subjectId = parseInt(subject);
    }

    if (topic) {
      where.topic = topic;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Quiz.findAndCountAll({
      where,
      include: [createdByInclude, subjectInclude],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    // Strip correct answers for list view
    const quizzes = rows.map(quiz => {
      const data = reshape(quiz);
      data.questions = data.questions.map(sanitizeQuestionForStudent);
      return data;
    });

    res.json({ success: true, quizzes, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};


exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, { include: [createdByInclude, subjectInclude] });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isOwner = req.user && quiz.createdBy === req.user.id;
    const data = reshape(quiz);

    if (!isOwner) {
      data.questions = data.questions.map(sanitizeQuestionForStudent);
    }

    res.json({ success: true, quiz: data });
  } catch (error) {
    next(error);
  }
};

exports.createQuiz = async (req, res, next) => {
  try {
    const { title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags, subject, topic } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required' });
    }

    const quiz = await Quiz.create({
      createdBy: req.user.id,
      title, description,
      subjectId: subject || null,
      topic: topic || null,
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

    const { title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags, subject, topic } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = assignQuestionIds(questions);
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (shuffleQuestions !== undefined) quiz.shuffleQuestions = shuffleQuestions;
    if (isPublished !== undefined) quiz.isPublished = isPublished;
    if (tags !== undefined) quiz.tags = tags;
    if (subject !== undefined) quiz.subjectId = subject || null;
    if (topic !== undefined) quiz.topic = topic || null;
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
      const qId = question._id ?? index;
      const submittedAnswer = answers && Array.isArray(answers)
        ? answers.find(a => String(a.questionId) === String(qId))
        : null;

      if (question.type === 'match-pairs') {
        const submittedMatches = submittedAnswer?.matches || submittedAnswer?.pairs || [];
        const totalPairs = Array.isArray(question.pairs) ? question.pairs.length : 4;
        let correctCount = 0;
        if (Array.isArray(question.pairs) && Array.isArray(submittedMatches)) {
          question.pairs.forEach(qp => {
            const match = submittedMatches.find(sm => String(sm.left ?? '').trim().toLowerCase() === String(qp.left ?? '').trim().toLowerCase());
            if (match && String(match.right ?? '').trim().toLowerCase() === String(qp.right ?? '').trim().toLowerCase()) {
              correctCount++;
            }
          });
        }
        const isCorrect = totalPairs > 0 && correctCount === totalPairs;
        const qPoints = question.points || 1;
        const pointsEarned = isCorrect ? qPoints : 0;
        return {
          questionId: qId,
          matches: submittedMatches,
          correctCount,
          totalPairs,
          isCorrect,
          pointsEarned,
        };
      }

      const chosenIndex = submittedAnswer ? submittedAnswer.chosenIndex : -1;
      const isCorrect = chosenIndex === question.correctIndex;
      return {
        questionId: qId,
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
      questions: quiz.questions.map((q, i) => {
        const ga = gradedAnswers[i];
        if (q.type === 'match-pairs') {
          return {
            _id: q._id ?? i,
            text: q.text,
            type: q.type,
            pairs: q.pairs,
            submittedMatches: ga.matches,
            correctCount: ga.correctCount,
            totalPairs: ga.totalPairs,
            explanation: q.explanation,
            isCorrect: ga.isCorrect,
            pointsEarned: ga.pointsEarned,
          };
        }
        return {
          _id: q._id ?? i,
          text: q.text,
          type: q.type,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          chosenIndex: ga.chosenIndex,
          isCorrect: ga.isCorrect,
          pointsEarned: ga.pointsEarned,
        };
      }),
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

      const isMatchPairs = lines.some(l => /^MATCH_PAIRS$/i.test(l)) || lines.some(l => /^LEFT_1:/i.test(l));
      const isTrueFalse = lines.some(l => /^TRUE_FALSE$/i.test(l));
      let explanation = '', points = 1;

      const explanationLine = lines.find(l => /^EXPLANATION:/i.test(l));
      if (explanationLine) explanation = explanationLine.replace(/^EXPLANATION:/i, '').trim();

      const pointsLine = lines.find(l => /^POINTS:/i.test(l));
      if (pointsLine) points = parseInt(pointsLine.replace(/^POINTS:/i, '').trim()) || 1;

      if (isMatchPairs) {
        const pairs = [];
        for (let i = 1; i <= 4; i++) {
          const leftLine = lines.find(l => new RegExp(`^LEFT_${i}:`, 'i').test(l));
          const rightLine = lines.find(l => new RegExp(`^RIGHT_${i}:`, 'i').test(l));
          const pairLine = lines.find(l => new RegExp(`^PAIR_${i}:`, 'i').test(l));

          let left = '', right = '';
          if (leftLine && rightLine) {
            left = leftLine.replace(new RegExp(`^LEFT_${i}:\\s*`, 'i'), '').trim();
            right = rightLine.replace(new RegExp(`^RIGHT_${i}:\\s*`, 'i'), '').trim();
          } else if (pairLine) {
            const content = pairLine.replace(new RegExp(`^PAIR_${i}:\\s*`, 'i'), '').trim();
            const parts = content.split('|').map(s => s.trim());
            if (parts.length >= 2) {
              left = parts[0];
              right = parts.slice(1).join('|').trim();
            }
          }
          if (left && right) {
            pairs.push({ left, right });
          }
        }

        if (pairs.length === 4) {
          questions.push({ text: qText, type: 'match-pairs', pairs, points, explanation });
        }
      } else if (isTrueFalse) {
        let options = ['True', 'False'], correctIndex = 0;
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          correctIndex = answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase() === 'TRUE' ? 0 : 1;
        }
        questions.push({ text: qText, type: 'true-false', options, correctIndex, explanation, points });
      } else {
        const optionLines = lines.filter(l => /^[A-D]\)/i.test(l));
        const options = optionLines.map(l => l.replace(/^[A-D]\)\s*/i, '').trim());
        let correctIndex = 0;
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          const idx = ['A', 'B', 'C', 'D'].indexOf(answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase());
          correctIndex = idx >= 0 ? idx : 0;
        }
        if (options.length >= 2) {
          questions.push({ text: qText, type: 'multiple-choice', options, correctIndex, explanation, points });
        }
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found. Check the file format.' });
    }

    const { subject, topic: reqTopic } = req.body;
    
    const quiz = await Quiz.create({
      createdBy: req.user.id,
      title, description,
      subjectId: subject || null,
      topic: reqTopic || null,
      questions: assignQuestionIds(questions),
      passingScore, timeLimit, tags,
      isPublished: true,
    });

    res.status(201).json({ success: true, quiz, message: `Quiz created with ${questions.length} questions` });
  } catch (error) {
    next(error);
  }
};

