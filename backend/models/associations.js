const User = require('./User');
const Note = require('./Note');
const Video = require('./Video');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const Flashcard = require('./Flashcard');
const Subject = require('./Subject');
const UserActivity = require('./UserActivity');
const KaraokeAudio = require('./KaraokeAudio');
const UserNodeProgress = require('./UserNodeProgress');
const UserQuest = require('./UserQuest');
const CurriculumLesson = require('./CurriculumLesson');
const RewardTransaction = require('./RewardTransaction');
const Page = require('./Page');

Note.belongsTo(User,     { foreignKey: 'owner',     as: 'ownerUser', onDelete: 'CASCADE' });
Note.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject', onDelete: 'SET NULL' });
Subject.hasMany(Note,    { foreignKey: 'subjectId', as: 'notes', onDelete: 'SET NULL' });

Note.hasMany(KaraokeAudio, { foreignKey: 'noteId', as: 'audioTracks', onDelete: 'CASCADE' });
KaraokeAudio.belongsTo(Note, { foreignKey: 'noteId', as: 'note', onDelete: 'CASCADE' });

Video.belongsTo(User,    { foreignKey: 'addedBy',   as: 'addedByUser', onDelete: 'CASCADE' });

Quiz.belongsTo(User,     { foreignKey: 'createdBy', as: 'createdByUser', onDelete: 'CASCADE' });
Quiz.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject', onDelete: 'SET NULL' });
Subject.hasMany(Quiz,    { foreignKey: 'subjectId', as: 'quizzes', onDelete: 'SET NULL' });

Flashcard.belongsTo(User,{ foreignKey: 'owner',     as: 'ownerUser', onDelete: 'CASCADE' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId',    as: 'quiz', onDelete: 'CASCADE' });

User.hasMany(UserActivity, { foreignKey: 'userId', as: 'activities', onDelete: 'CASCADE' });
UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(UserNodeProgress, { foreignKey: 'userId', as: 'nodeProgress', onDelete: 'CASCADE' });
UserNodeProgress.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(UserQuest, { foreignKey: 'userId', as: 'quests', onDelete: 'CASCADE' });
UserQuest.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(RewardTransaction, { foreignKey: 'userId', as: 'rewardTransactions', onDelete: 'CASCADE' });
RewardTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(CurriculumLesson, { foreignKey: 'owner', as: 'curriculumLessons', onDelete: 'CASCADE' });
CurriculumLesson.belongsTo(User, { foreignKey: 'owner', as: 'author', onDelete: 'CASCADE' });

Note.hasMany(CurriculumLesson, { foreignKey: 'sourceNoteId', as: 'curriculumLessons', onDelete: 'SET NULL' });
CurriculumLesson.belongsTo(Note, { foreignKey: 'sourceNoteId', as: 'sourceNote', onDelete: 'SET NULL' });

User.hasMany(Page, { foreignKey: 'authorId', as: 'pages', onDelete: 'CASCADE' });
Page.belongsTo(User, { foreignKey: 'authorId', as: 'author', onDelete: 'CASCADE' });


