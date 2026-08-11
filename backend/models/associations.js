const User = require('./User');
const Note = require('./Note');
const Video = require('./Video');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const Flashcard = require('./Flashcard');
const Subject = require('./Subject');

Note.belongsTo(User,     { foreignKey: 'owner',     as: 'ownerUser' });
Note.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject' });
Video.belongsTo(User,    { foreignKey: 'addedBy',   as: 'addedByUser' });
Quiz.belongsTo(User,     { foreignKey: 'createdBy', as: 'createdByUser' });
Quiz.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject' });
Flashcard.belongsTo(User,{ foreignKey: 'owner',     as: 'ownerUser' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId',    as: 'quiz' });
