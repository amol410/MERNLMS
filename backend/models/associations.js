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

Note.belongsTo(User,     { foreignKey: 'owner',     as: 'ownerUser' });
Note.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject' });
Note.hasMany(KaraokeAudio, { foreignKey: 'noteId', as: 'audioTracks' });
KaraokeAudio.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });
Video.belongsTo(User,    { foreignKey: 'addedBy',   as: 'addedByUser' });
Quiz.belongsTo(User,     { foreignKey: 'createdBy', as: 'createdByUser' });
Quiz.belongsTo(Subject,  { foreignKey: 'subjectId', as: 'subject' });
Flashcard.belongsTo(User,{ foreignKey: 'owner',     as: 'ownerUser' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId',    as: 'quiz' });
UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserNodeProgress, { foreignKey: 'userId', as: 'nodeProgress' });
UserNodeProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserQuest, { foreignKey: 'userId', as: 'quests' });
UserQuest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CurriculumLesson, { foreignKey: 'owner', as: 'curriculumLessons' });
CurriculumLesson.belongsTo(User, { foreignKey: 'owner', as: 'author' });
CurriculumLesson.belongsTo(Note, { foreignKey: 'sourceNoteId', as: 'sourceNote' });

