const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getStatus,
    getPath,
    completeNode,
    getLeaderboard,
    refillOxygen,
    getQuests,
    claimQuest,
    switchCourse,
    getLessonDetails,
} = require('../controllers/gamificationController');

router.use(protect);

router.get('/status', getStatus);
router.get('/path', getPath);
router.get('/lesson/:id', getLessonDetails);
router.post('/complete-node', completeNode);
router.get('/leaderboard', getLeaderboard);
router.post('/shop/refill-oxygen', refillOxygen);
router.get('/quests', getQuests);
router.post('/claim-quest', claimQuest);
router.post('/switch-course', switchCourse);

module.exports = router;

