const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getStatus,
    getPath,
    completeNode,
    getLeaderboard,
    refillOxygen,
    deductOxygen,
    buyStreakFreeze,
    buyDoubleXp,
    getQuests,
    claimQuest,
    switchCourse,
    getLessonDetails,
    claimAdReward,
    handleAdMobReward,
} = require('../controllers/gamificationController');

router.get('/admob/ssv', handleAdMobReward);

router.use(protect);

router.get('/status', getStatus);
router.get('/path', getPath);
router.get('/lesson/:id', getLessonDetails);
router.post('/complete-node', completeNode);
router.get('/leaderboard', getLeaderboard);
router.post('/refill-oxygen', refillOxygen);
router.post('/deduct-oxygen', deductOxygen);
router.post('/shop/refill-oxygen', refillOxygen);
router.post('/shop/buy-streak-freeze', buyStreakFreeze);
router.post('/shop/buy-double-xp', buyDoubleXp);
router.get('/quests', getQuests);
router.post('/claim-quest', claimQuest);
router.post('/quests/claim', claimQuest);
router.post('/switch-course', switchCourse);
router.post('/claim-ad-reward', claimAdReward);

module.exports = router;

