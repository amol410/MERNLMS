#!/usr/bin/env node
/**
 * Replay-pearls rollout report.
 *
 * Compares users who have the replay-pearls feature (user id bucket < REPLAY_PEARLS_ROLLOUT_PERCENT)
 * with users who do not, over the last N days (default 7):
 *   - active learners (users with at least one completed lesson)
 *   - lessons completed per active learner per day
 *   - rewarded/interstitial ad claims per active learner
 *   - pearl purchases (shop oxygen refills) per active learner
 *   - replay pearls paid out
 *
 * Usage (reads the same DB settings as the app):
 *   REPLAY_PEARLS_ROLLOUT_PERCENT=25 node scripts/replay_pearls_report.js [days]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const RewardTransaction = require('../models/RewardTransaction');

(async () => {
    const days = Math.max(1, parseInt(process.argv[2] || '7', 10));
    const percent = Math.min(100, Math.max(0, parseInt(process.env.REPLAY_PEARLS_ROLLOUT_PERCENT ?? '100', 10)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await RewardTransaction.findAll({
        where: { createdAt: { [Op.gte]: since } },
        attributes: ['userId', 'kind', 'pearlsEarned'],
        raw: true,
    });

    const blank = () => ({ users: new Set(), lessons: 0, ads: 0, purchases: 0, replayPearls: 0 });
    const cohorts = { 'with feature': blank(), 'without feature': blank() };

    for (const r of rows) {
        if (r.kind !== 'lesson') continue;
        cohorts[(r.userId % 100) < percent ? 'with feature' : 'without feature'].users.add(r.userId);
    }
    for (const r of rows) {
        const c = cohorts[(r.userId % 100) < percent ? 'with feature' : 'without feature'];
        if (!c.users.has(r.userId)) continue; // measure active learners only
        if (r.kind === 'lesson') c.lessons++;
        else if (r.kind === 'admob' || r.kind === 'client_ad') c.ads++;
        else if (r.kind === 'shop_refill') c.purchases++;
        else if (r.kind === 'replay_pearls') c.replayPearls += r.pearlsEarned || 0;
    }

    console.log(`Replay-pearls report — last ${days} day(s), rollout ${percent}%`);
    for (const [name, c] of Object.entries(cohorts)) {
        const n = c.users.size || 1;
        console.log(`\n${name}: ${c.users.size} active learners`);
        console.log(`  lessons/learner/day : ${(c.lessons / n / days).toFixed(2)}`);
        console.log(`  ad claims/learner   : ${(c.ads / n).toFixed(2)}`);
        console.log(`  pearl purchases/learner : ${(c.purchases / n).toFixed(2)}  (shop oxygen refills tracked from this release on)`);
        console.log(`  replay pearls paid  : ${c.replayPearls}`);
    }
    await sequelize.close();
})().catch(err => {
    console.error(err);
    process.exit(1);
});
