const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['multiple-choice', 'true-false'], default: 'multiple-choice' },
  options: [String],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  points: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, default: '' },
    questions: [questionSchema],
    totalPoints: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 },
    timeLimit: { type: Number, default: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    attemptLimit: { type: Number, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

quizSchema.pre('save', function (next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  next();
});

quizSchema.index({ createdBy: 1 });
quizSchema.index({ isPublished: 1 });
quizSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);
