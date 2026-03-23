const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

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
    if (!quiz.createdBy.equals(req.user._id)) {
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
