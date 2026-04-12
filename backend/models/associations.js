const User = require('./User');
const Note = require('./Note');
const Video = require('./Video');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const Flashcard = require('./Flashcard');

Note.belongsTo(User,     { foreignKey: 'owner',     as: 'ownerUser' });
Video.belongsTo(User,    { foreignKey: 'addedBy',   as: 'addedByUser' });
Quiz.belongsTo(User,     { foreignKey: 'createdBy', as: 'createdByUser' });
Flashcard.belongsTo(User,{ foreignKey: 'owner',     as: 'ownerUser' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId',    as: 'quiz' });
