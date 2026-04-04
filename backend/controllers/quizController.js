const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const mammoth = require('mammoth');

exports.getQuizzes = async (req, res, next) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };
    if (q) query.$text = { $search: q };
    if (tag) query.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('createdBy', 'name avatar')
        .select('-questions.correctIndex -questions.explanation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Quiz.countDocuments(query),
    ]);

    res.json({ success: true, quizzes, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name avatar');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isOwner = req.user && quiz.createdBy._id.equals(req.user._id);

    if (!isOwner) {
      const safeQuiz = quiz.toObject();
      safeQuiz.questions = safeQuiz.questions.map(({ correctIndex, explanation, ...q }) => q);
      return res.json({ success: true, quiz: safeQuiz });
    }

    res.json({ success: true, quiz });
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
      createdBy: req.user._id,
      title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags,
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

exports.updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.createdBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.createdBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    next(error);
  }
};

exports.submitAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const { answers, startedAt, timeTakenSecs } = req.body;

    // Check attempt limit
    if (quiz.attemptLimit) {
      const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
      if (attemptCount >= quiz.attemptLimit) {
        return res.status(400).json({ success: false, message: 'Attempt limit reached' });
      }
    }

    const attemptNumber = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id }) + 1;

    // Grade answers
    const gradedAnswers = quiz.questions.map((question) => {
      const submittedAnswer = answers.find(a => a.questionId === question._id.toString());
      const chosenIndex = submittedAnswer ? submittedAnswer.chosenIndex : -1;
      const isCorrect = chosenIndex === question.correctIndex;
      return {
        questionId: question._id,
        chosenIndex,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      };
    });

    const score = gradedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const maxScore = quiz.totalPoints;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      answers: gradedAnswers,
      score, maxScore, percentage, passed, attemptNumber,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      submittedAt: new Date(),
      timeTakenSecs,
    });

    // Return full details including correct answers with explanations
    const result = {
      attempt,
      questions: quiz.questions.map((q, i) => ({
        _id: q._id,
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
    const attempts = await QuizAttempt.find({ quiz: req.params.id, student: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttempts = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    // Admin can view any quiz results; trainers can only view their own quizzes
    if (req.user.role !== 'admin' && !quiz.createdBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const attempts = await QuizAttempt.find({ quiz: req.params.id })
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });
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

    // Parse quiz metadata
    const titleMatch = text.match(/^TITLE:\s*(.+)/m);
    const descMatch = text.match(/^DESCRIPTION:\s*(.+)/m);
    const passingMatch = text.match(/^PASSING_SCORE:\s*(\d+)/m);
    const timeLimitMatch = text.match(/^TIME_LIMIT:\s*(\d+)/m);
    const tagsMatch = text.match(/^TAGS:\s*(.+)/m);

    const title = titleMatch ? titleMatch[1].trim() : 'Uploaded Quiz';
    const description = descMatch ? descMatch[1].trim() : '';
    const passingScore = passingMatch ? parseInt(passingMatch[1]) : 70;
    const timeLimit = timeLimitMatch ? parseInt(timeLimitMatch[1]) : 0;
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];

    // Parse questions
    // Split by Q: or Q1: Q2: etc.
    const questionBlocks = text.split(/\n(?=Q\d*:|\nQ\d*:)/i).filter(b => b.match(/^Q\d*:/i));

    const questions = [];
    for (const block of questionBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

      // Question text (first line after Q:)
      const qLineMatch = lines[0].match(/^Q\d*:\s*(.+)/i);
      if (!qLineMatch) continue;
      const qText = qLineMatch[1].trim();

      // Check if TRUE_FALSE type
      const isTrueFalse = lines.some(l => /^TRUE_FALSE$/i.test(l));

      let options = [];
      let correctIndex = 0;
      let explanation = '';
      let points = 1;

      if (isTrueFalse) {
        options = ['True', 'False'];
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          const ans = answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase();
          correctIndex = ans === 'TRUE' ? 0 : 1;
        }
      } else {
        // Multiple choice: lines starting with A) B) C) D)
        const optionLines = lines.filter(l => /^[A-D]\)/i.test(l));
        options = optionLines.map(l => l.replace(/^[A-D]\)\s*/i, '').trim());

        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          const ans = answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase();
          const idx = ['A', 'B', 'C', 'D'].indexOf(ans);
          correctIndex = idx >= 0 ? idx : 0;
        }
      }

      const explanationLine = lines.find(l => /^EXPLANATION:/i.test(l));
      if (explanationLine) explanation = explanationLine.replace(/^EXPLANATION:/i, '').trim();

      const pointsLine = lines.find(l => /^POINTS:/i.test(l));
      if (pointsLine) points = parseInt(pointsLine.replace(/^POINTS:/i, '').trim()) || 1;

      if (options.length >= 2) {
        questions.push({
          text: qText,
          type: isTrueFalse ? 'true-false' : 'multiple-choice',
          options,
          correctIndex,
          explanation,
          points,
        });
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found. Check the file format.' });
    }

    const quiz = await Quiz.create({
      createdBy: req.user._id,
      title, description, questions, passingScore, timeLimit, tags,
      isPublished: false,
    });

    res.status(201).json({ success: true, quiz, message: `Quiz created with ${questions.length} questions` });
  } catch (error) {
    next(error);
  }
};
