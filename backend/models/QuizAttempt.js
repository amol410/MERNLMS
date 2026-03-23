const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        chosenIndex: { type: Number, default: -1 },
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: Number,
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
    startedAt: Date,
    submittedAt: Date,
    timeTakenSecs: Number,
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1 });
quizAttemptSchema.index({ student: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
