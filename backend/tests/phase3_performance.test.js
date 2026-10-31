const request = require('supertest');
const zlib = require('zlib');
const app = require('../server');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const RewardTransaction = require('../models/RewardTransaction');
const { createTestUser, sequelize } = require('./setup');

describe('Phase 3 Performance & Weekly Leagues Test Suite', () => {

    /* ======================================================================
     * 1. Gzip Compression Middleware
     * ====================================================================== */
    describe('Express Gzip Compression', () => {
        it('compresses JSON responses > 1KB when Accept-Encoding: gzip is requested', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/gamification/path?targetLanguage=de&nativeLanguage=en&level=A1')
                .set('Authorization', `Bearer ${token}`)
                .set('Accept-Encoding', 'gzip');

            expect(res.status).toBe(200);
            expect(res.headers['content-encoding']).toBe('gzip');
        });

        it('respects x-no-compression header and leaves response uncompressed', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/gamification/path?targetLanguage=de&nativeLanguage=en&level=A1')
                .set('Authorization', `Bearer ${token}`)
                .set('Accept-Encoding', 'gzip')
                .set('x-no-compression', '1');

            expect(res.status).toBe(200);
            expect(res.headers['content-encoding']).toBeUndefined();
        });
    });

    /* ======================================================================
     * 2. Weekly League Engine & Dynamic Cohorts
     * ====================================================================== */
    describe('GET /api/gamification/leaderboard', () => {
        it('requires authentication (returns 401 when no token)', async () => {
            const res = await request(app)
                .get('/api/gamification/leaderboard')
                .send();

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('returns real weekly countdown, week bounds, promotion/demotion metadata', async () => {
            const { token } = await createTestUser({ currentLeague: 'Coral Reef' });

            const res = await request(app)
                .get('/api/gamification/leaderboard?league=Coral%20Reef')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.league).toBe('Coral Reef');
            expect(res.body.timeRemaining).toMatch(/\d+d \d+h left/);
            expect(res.body.weekStart).toBeDefined();
            expect(res.body.weekEnd).toBeDefined();
            expect(res.body.promotionZone).toBe(10);
            expect(res.body.demotionZone).toBe(5);
            expect(Array.isArray(res.body.leaderboard)).toBe(true);
        });

        it('assigns promotion, safe, and demotion tierZones accurately based on ranking', async () => {
            const { user, token } = await createTestUser({ currentLeague: 'Coral Reef' });

            const res = await request(app)
                .get('/api/gamification/leaderboard?league=Coral%20Reef')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            const entries = res.body.leaderboard;
            expect(entries.length).toBeGreaterThan(0);

            for (const entry of entries) {
                if (entry.rank <= 10) {
                    expect(entry.tierZone).toBe('promotion');
                } else if (entry.rank > 25) {
                    expect(entry.tierZone).toBe('demotion');
                } else {
                    expect(entry.tierZone).toBe('safe');
                }
            }

            // Confirm requesting user is present in leaderboard
            const selfEntry = entries.find(e => e.id === user.id);
            expect(selfEntry).toBeDefined();
            expect(selfEntry.isCurrent).toBe(true);
        });

        it('ranks active users by weekly XP earned in current week rather than historical totalXp', async () => {
            // User A has 1000 historical XP but 0 this week
            const { user: userA, token: tokenA } = await createTestUser({
                name: 'Historical Star',
                totalXp: 1000,
                currentLeague: 'Coral Reef',
            });

            // User B has 50 historical XP but earned 80 XP this week
            const { user: userB, token: tokenB } = await createTestUser({
                name: 'Weekly Climber',
                totalXp: 50,
                currentLeague: 'Coral Reef',
            });

            await RewardTransaction.create({
                userId: userB.id,
                kind: 'lesson',
                reference: `week_tx_${Date.now()}`,
                xpEarned: 80,
                pearlsEarned: 5,
                responseBody: { success: true },
                createdAt: new Date(), // this week
            });

            const res = await request(app)
                .get('/api/gamification/leaderboard?league=Coral%20Reef')
                .set('Authorization', `Bearer ${tokenB}`);

            expect(res.status).toBe(200);
            const climber = res.body.leaderboard.find(e => e.id === userB.id);
            expect(climber).toBeDefined();
            expect(climber.xp).toBe(80);
        });
    });

    /* ======================================================================
     * 3. Heavy Payload Optimization (Map Path Stages Omission)
     * ====================================================================== */
    describe('Map Path Navigation Payload Optimization', () => {
        it('omits heavy stage data in getPath and provides stages: null', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/gamification/path')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.nodes).toBeDefined();

            for (const node of res.body.nodes) {
                // Nodes on the archipelago map must have null stages to save payload bandwidth
                expect(node.stages).toBeNull();
                expect(node.index).toBeDefined();
                expect(node.title).toBeDefined();
            }
        });
    });

    /* ======================================================================
     * 4. UserActivity Composite Index Queries
     * ====================================================================== */
    describe('UserActivity Composite Indexes', () => {
        it('queries efficiently by [userId, activityDate] and [userId, createdAt]', async () => {
            const { user } = await createTestUser();

            // Insert activities
            await UserActivity.create({
                userId: user.id,
                activityType: 'lesson',
                resourceId: 1,
                resourceTitle: 'Greetings in German',
                activityDate: '2026-11-01',
            });

            const byDate = await UserActivity.findAll({
                where: { userId: user.id, activityDate: '2026-11-01' },
            });
            expect(byDate.length).toBe(1);

            const byCreatedAt = await UserActivity.findAll({
                where: { userId: user.id },
                order: [['createdAt', 'DESC']],
            });
            expect(byCreatedAt.length).toBe(1);
            expect(byCreatedAt[0].resourceTitle).toBe('Greetings in German');
        });
    });
});
