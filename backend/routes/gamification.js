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
} = require('../controllers/gamificationController');

router.use(protect);

router.get('/status', getStatus);
router.get('/path', getPath);
router.post('/complete-node', completeNode);
router.get('/leaderboard', getLeaderboard);
router.post('/shop/refill-oxygen', refillOxygen);
router.get('/quests', getQuests);
router.post('/claim-quest', claimQuest);

module.exports = router;

