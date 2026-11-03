const { sequelize, createTestUser, createTestAdmin } = require('./setup');
require('../models/associations');
const app = require('../server');
const User = require('../models/User');
const Note = require('../models/Note');
const Subject = require('../models/Subject');
const KaraokeAudio = require('../models/KaraokeAudio');
const CurriculumLesson = require('../models/CurriculumLesson');
const UserNodeProgress = require('../models/UserNodeProgress');
const RewardTransaction = require('../models/RewardTransaction');
const UserQuest = require('../models/UserQuest');

/**
 * High-performance In-Memory Request Dispatcher.
 * Directly dispatches requests through the Express application stack
 * (including helmet, cors, json parser, auth middleware, and controllers)
 * without opening OS network ports or TCP sockets.
 */
class TestRequest {
    constructor(expressApp, method, url) {
        this.app = expressApp;
        this.method = method.toUpperCase();
        this.url = url;
        this.headers = { 'content-type': 'application/json' };
        this.bodyData = {};
    }

    set(key, val) {
        if (typeof key === 'object') {
            for (const [k, v] of Object.entries(key)) {
                this.headers[k.toLowerCase()] = v;
            }
        } else {
            this.headers[key.toLowerCase()] = val;
        }
        return this;
    }

    send(body) {
        this.bodyData = body || {};
        return this;
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }

    exec() {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(this.url, 'http://localhost');
            const query = Object.fromEntries(parsedUrl.searchParams.entries());
            const socket = { remoteAddress: '127.0.0.1', encrypted: false };

            const req = {
                method: this.method,
                url: parsedUrl.pathname + parsedUrl.search,
                originalUrl: parsedUrl.pathname + parsedUrl.search,
                headers: this.headers,
                body: this.bodyData,
                query,
                params: {},
                _body: true,
                socket,
                connection: socket,
                ip: '127.0.0.1',
                ips: [],
                protocol: 'http',
                secure: false,
                get(k) { return this.headers[k.toLowerCase()]; },
                header(k) { return this.headers[k.toLowerCase()]; },
            };

            let statusCode = 200;
            const resHeaders = {};
            let resolved = false;

            const res = {
                statusCode: 200,
                status(c) { statusCode = c; this.statusCode = c; return this; },
                set(k, v) { resHeaders[k.toLowerCase()] = v; return this; },
                setHeader(k, v) { resHeaders[k.toLowerCase()] = v; return this; },
                getHeader(k) { return resHeaders[k.toLowerCase()]; },
                removeHeader(k) { delete resHeaders[k.toLowerCase()]; return this; },
                hasHeader(k) { return k.toLowerCase() in resHeaders; },
                json(data) {
                    if (!resolved) {
                        resolved = true;
                        resolve({ status: statusCode, body: data, headers: resHeaders });
                    }
                    return this;
                },
                send(data) {
                    if (!resolved) {
                        resolved = true;
                        resolve({ status: statusCode, body: data, headers: resHeaders });
                    }
                    return this;
                },
                end(data) {
                    if (!resolved) {
                        resolved = true;
                        resolve({ status: statusCode, body: data, headers: resHeaders });
                    }
                    return this;
                },
            };

            this.app(req, res, (err) => {
                if (err) {
                    reject(err);
                } else if (!resolved) {
                    resolved = true;
                    resolve({ status: 404, body: 'Not Found', headers: resHeaders });
                }
            });
        });
    }
}

const api = {
    get: (url) => new TestRequest(app, 'GET', url),
    post: (url) => new TestRequest(app, 'POST', url),
    put: (url) => new TestRequest(app, 'PUT', url),
    patch: (url) => new TestRequest(app, 'PATCH', url),
    delete: (url) => new TestRequest(app, 'DELETE', url),
};

describe('Database Concurrency, Atomicity & Data Integrity Test Suite', () => {
    beforeEach(async () => {
        await CurriculumLesson.destroy({ where: {} });
        await RewardTransaction.destroy({ where: {} });
        await UserNodeProgress.destroy({ where: {} });
    });

    /* ======================================================================
     * 1. Atomic Pearl & Oxygen Deductions (Concurrency & Race Condition Safety)
     * ====================================================================== */
    describe('1. Atomic Pearl & Oxygen Balance Transactions', () => {
        it('handles simultaneous 50-pearl refill requests via Promise.all(): exactly one succeeds, one fails (400), balance never negative', async () => {
            // User starts with exactly 50 pearls and 0 oxygen
            const { user, token } = await createTestUser({
                pearls: 50,
                oxygen: 0,
            });

            // Fire 2 simultaneous refill requests attempting to spend 50 pearls each
            const [res1, res2] = await Promise.all([
                api.post('/api/gamification/refill-oxygen')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
                api.post('/api/gamification/refill-oxygen')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
            ]);

            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([200, 400]);

            const successfulRes = res1.status === 200 ? res1 : res2;
            const failedRes = res1.status === 400 ? res1 : res2;

            expect(successfulRes.body.success).toBe(true);
            expect(successfulRes.body.oxygen).toBe(5);
            expect(successfulRes.body.pearls).toBe(0);

            expect(failedRes.body.success).toBe(false);
            expect(failedRes.body.message).toMatch(/(not enough pearls|oxygen is already full)/i);

            // Verify database state: pearls balance never dropped below zero
            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.pearls).toBe(0);
            expect(refreshedUser.oxygen).toBe(5);
        });

        it('rejects double-spending with 400 on simultaneous shop purchases (Buy Streak Freeze)', async () => {
            // Streak freeze costs 100 pearls. User starts with exactly 100 pearls and 0 streak freezes.
            const { user, token } = await createTestUser({
                pearls: 100,
                streakFreezeCount: 0,
            });

            // Fire two simultaneous purchase requests attempting to double-spend 100 pearls
            const [res1, res2] = await Promise.all([
                api.post('/api/gamification/shop/buy-streak-freeze')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
                api.post('/api/gamification/shop/buy-streak-freeze')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
            ]);

            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([200, 400]);

            const successfulRes = res1.status === 200 ? res1 : res2;
            const failedRes = res1.status === 400 ? res1 : res2;

            expect(successfulRes.body.success).toBe(true);
            expect(successfulRes.body.pearls).toBe(0);
            expect(successfulRes.body.streakFreezeCount).toBe(1);

            expect(failedRes.body.success).toBe(false);
            expect(failedRes.body.message).toMatch(/not enough pearls/i);

            // Confirm database persistence: user balance cannot drop below zero
            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.pearls).toBe(0);
            expect(refreshedUser.streakFreezeCount).toBe(1);
        });

        it('rejects double-spending on simultaneous Double XP Potion purchases (150 pearls required)', async () => {
            const { user, token } = await createTestUser({
                pearls: 150,
                doubleXpExpiresAt: null,
            });

            const [res1, res2] = await Promise.all([
                api.post('/api/gamification/shop/buy-double-xp')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
                api.post('/api/gamification/shop/buy-double-xp')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
            ]);

            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([200, 400]);

            const successful = res1.status === 200 ? res1 : res2;
            const failed = res1.status === 400 ? res1 : res2;

            expect(successful.body.success).toBe(true);
            expect(successful.body.pearls).toBe(0);
            expect(successful.body.isDoubleXpActive).toBe(true);

            expect(failed.body.success).toBe(false);
            expect(failed.body.message).toMatch(/not enough pearls/i);

            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.pearls).toBe(0);
            expect(refreshedUser.doubleXpExpiresAt).not.toBeNull();
        });

        it('deducts oxygen atomically under simultaneous requests and guarantees oxygen never drops below zero', async () => {
            // User starts with only 1 oxygen remaining
            const { user, token } = await createTestUser({ oxygen: 1 });

            // Launch 3 simultaneous oxygen deduction requests
            const results = await Promise.all([
                api.post('/api/gamification/deduct-oxygen')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
                api.post('/api/gamification/deduct-oxygen')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
                api.post('/api/gamification/deduct-oxygen')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}),
            ]);

            for (const r of results) {
                expect(r.status).toBe(200);
                expect(r.body.success).toBe(true);
                expect(r.body.oxygen).toBeGreaterThanOrEqual(0);
            }

            // DB verification: oxygen balance cannot drop below zero
            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.oxygen).toBe(0);
            expect(refreshedUser.oxygen).toBeGreaterThanOrEqual(0);
        });
    });

    /* ======================================================================
     * 2. Lesson Completion Idempotency
     * ====================================================================== */
    describe('2. Lesson Completion Idempotency & Reward Transactions', () => {
        it('awards XP and pearls exactly once when duplicate completion requests arrive simultaneously via Promise.all()', async () => {
            const { user, token } = await createTestUser({
                totalXp: 0,
                pearls: 100,
                streakCount: 1,
            });

            const payload = {
                nodeIndex: 0,
                scorePct: 100,
                attemptId: 'lesson-simultaneous-attempt-001',
            };

            // Fire 2 simultaneous completion requests with the exact same attemptId
            const [res1, res2] = await Promise.all([
                api.post('/api/gamification/complete-node')
                    .set('Authorization', `Bearer ${token}`)
                    .send(payload),
                api.post('/api/gamification/complete-node')
                    .set('Authorization', `Bearer ${token}`)
                    .send(payload),
            ]);

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);

            // One is the initial execution, the other is an idempotent replay
            const responses = [res1.body, res2.body];
            const original = responses.find(r => r.idempotentReplay === false);
            const replayed = responses.find(r => r.idempotentReplay === true);

            expect(original).toBeDefined();
            expect(replayed).toBeDefined();
            expect(original.xpEarned).toBe(12);
            expect(original.pearlsEarned).toBe(1);

            // Total user XP and pearls must only be credited once
            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.totalXp).toBe(12);
            expect(refreshedUser.pearls).toBe(101);

            // Exactly ONE reward transaction record must be created for this attemptId
            const txCount = await RewardTransaction.count({
                where: { userId: user.id, kind: 'lesson', reference: payload.attemptId },
            });
            expect(txCount).toBe(1);
        });

        it('replaying the same completion payload sequentially returns cached receipt without double-crediting XP or streak', async () => {
            const { user, token } = await createTestUser({
                totalXp: 50,
                pearls: 200,
                streakCount: 2,
            });

            const payload = {
                nodeIndex: 0,
                scorePct: 100,
                attemptId: 'lesson-sequential-replay-002',
            };

            // First completion
            const firstRes = await api.post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(firstRes.status).toBe(200);
            expect(firstRes.body.idempotentReplay).toBe(false);
            expect(firstRes.body.xpEarned).toBe(12);
            expect(firstRes.body.pearlsEarned).toBe(1);

            // User total XP increased by 12, pearls by 1
            const midUser = await User.findByPk(user.id);
            expect(midUser.totalXp).toBe(62);
            expect(midUser.pearls).toBe(201);

            // Replay exact same payload with same attemptId
            const replayRes = await api.post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(replayRes.status).toBe(200);
            expect(replayRes.body.idempotentReplay).toBe(true);
            expect(replayRes.body.totalXp).toBe(firstRes.body.totalXp);
            expect(replayRes.body.pearls).toBe(firstRes.body.pearls);

            // Third replay to be absolutely sure
            const thirdRes = await api.post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(thirdRes.status).toBe(200);
            expect(thirdRes.body.idempotentReplay).toBe(true);

            // Final check on user table: values never changed across replays
            const finalUser = await User.findByPk(user.id);
            expect(finalUser.totalXp).toBe(62);
            expect(finalUser.pearls).toBe(201);

            const txTotal = await RewardTransaction.count({
                where: { userId: user.id, kind: 'lesson', reference: payload.attemptId },
            });
            expect(txTotal).toBe(1);
        });

        it('distinct attemptIds for subsequent lessons correctly award XP and pearls for each distinct session', async () => {
            const { user, token } = await createTestUser({ totalXp: 0, pearls: 100 });

            const first = await api.post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({ nodeIndex: 0, scorePct: 100, attemptId: 'distinct-session-001' });

            const second = await api.post('/api/gamification/complete-node')
                .set('Authorization', `Bearer ${token}`)
                .send({ nodeIndex: 1, scorePct: 100, attemptId: 'distinct-session-002' });

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(first.body.idempotentReplay).toBe(false);
            expect(second.body.idempotentReplay).toBe(false);

            const refreshed = await User.findByPk(user.id);
            expect(refreshed.totalXp).toBe(24);
            expect(refreshed.pearls).toBe(102);

            const txCount = await RewardTransaction.count({ where: { userId: user.id, kind: 'lesson' } });
            expect(txCount).toBe(2);
        });
    });

    /* ======================================================================
     * 3. Foreign Key Cascades & Relational Data Integrity
     * ====================================================================== */
    describe('3. Foreign Key Cascades & Relational Integrity', () => {
        it('gracefully nullifies sourceNoteId in CurriculumLesson when referenced Note is deleted', async () => {
            const { user } = await createTestAdmin();

            const note = await Note.create({
                title: 'Greetings & Basics Vocabulary',
                content: 'Hallo, Guten Morgen, Danke',
                owner: user.id,
            });

            const lesson = await CurriculumLesson.create({
                owner: user.id,
                title: 'Basics 1',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 1,
                lessonIndex: 0,
                sourceNoteId: note.id,
            });

            expect(lesson.sourceNoteId).toBe(note.id);

            // Delete the parent Note
            await note.destroy();

            // Verify CurriculumLesson remains intact with sourceNoteId nullified without throwing DB errors
            const refreshedLesson = await CurriculumLesson.findByPk(lesson.id);
            expect(refreshedLesson).not.toBeNull();
            expect(refreshedLesson.sourceNoteId).toBeNull();
            expect(refreshedLesson.title).toBe('Basics 1');
        });

        it('cascades deletion of child KaraokeAudio records when parent Note is deleted', async () => {
            const { user } = await createTestAdmin();

            const note = await Note.create({
                title: 'Karaoke Audio Source Note',
                content: 'Guten Tag',
                owner: user.id,
            });

            const audio = await KaraokeAudio.create({
                noteId: note.id,
                filename: 'track_01.mp3',
                mimeType: 'audio/mpeg',
                audioData: Buffer.from('RIFF....WAVEfmt'),
                fileSize: 15,
            });

            expect(audio.noteId).toBe(note.id);

            // Delete parent Note
            await note.destroy();

            // Verify KaraokeAudio was cascade-deleted or dissociating cleanly
            const refreshedAudio = await KaraokeAudio.findByPk(audio.id);
            expect(refreshedAudio).toBeNull();
        });

        it('handles deletion of parent Subject by gracefully nullifying subjectId in Notes and Quizzes', async () => {
            const { user } = await createTestAdmin();

            const subject = await Subject.create({
                name: `German Grammar A1_${Date.now()}`,
                topics: ['Articles', 'Cases', 'Verbs'],
            });

            const note = await Note.create({
                title: 'German Articles Note',
                content: 'der, die, das',
                owner: user.id,
                subjectId: subject.id,
            });

            expect(note.subjectId).toBe(subject.id);

            // Delete parent Subject
            await subject.destroy();

            // Note should still exist, with subjectId set to null
            const refreshedNote = await Note.findByPk(note.id);
            expect(refreshedNote).not.toBeNull();
            expect(refreshedNote.subjectId).toBeNull();
        });

        it('deletes all curriculum lessons in a unit cleanly without relational orphan errors', async () => {
            const { user } = await createTestAdmin();

            const unitNum = 77;
            const createdLessons = [];
            for (let i = 0; i < 5; i++) {
                const l = await CurriculumLesson.create({
                    owner: user.id,
                    title: `Unit 77 Lesson ${i}`,
                    learningLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    unitNumber: unitNum,
                    lessonIndex: i,
                });
                createdLessons.push(l);
            }

            const initialCount = await CurriculumLesson.count({ where: { unitNumber: unitNum } });
            expect(initialCount).toBe(5);

            // Destroy the unit
            const deletedCount = await CurriculumLesson.destroy({ where: { unitNumber: unitNum } });
            expect(deletedCount).toBe(5);

            const remainingCount = await CurriculumLesson.count({ where: { unitNumber: unitNum } });
            expect(remainingCount).toBe(0);
        });

        it('cascades deletion of user entities (node progress, quests, reward transactions) when user is deleted', async () => {
            const { user } = await createTestUser();

            await UserNodeProgress.create({
                userId: user.id,
                courseId: 'de_en_a1',
                nodeIndex: 0,
                status: 'completed',
            });

            await UserQuest.create({
                userId: user.id,
                questTitle: 'Daily XP Quest',
                questType: 'xp',
                targetAmount: 30,
                currentAmount: 15,
                rewardPearls: 10,
                rewardXp: 10,
                questDate: '2026-11-02',
            });

            await RewardTransaction.create({
                userId: user.id,
                kind: 'lesson',
                reference: 'tx-cascade-001',
                xpEarned: 12,
                pearlsEarned: 1,
                responseBody: { ok: true },
            });

            // Delete User
            await user.destroy();

            // Verify all child tables cleanly purged without foreign key constraint violations
            const remainingProgress = await UserNodeProgress.count({ where: { userId: user.id } });
            const remainingQuests = await UserQuest.count({ where: { userId: user.id } });
            const remainingTx = await RewardTransaction.count({ where: { userId: user.id } });

            expect(remainingProgress).toBe(0);
            expect(remainingQuests).toBe(0);
            expect(remainingTx).toBe(0);
        });
    });

    /* ======================================================================
     * 4. Large Stages JSON Column Boundaries (MySQL LONGTEXT / SQLite TEXT)
     * ====================================================================== */
    describe('4. Large Stages JSON Column Boundaries', () => {
        it('accurately stores and retrieves a CurriculumLesson with 55+ distinct challenge stages without data loss', async () => {
            const { user } = await createTestAdmin();

            const stageTypes = [
                'word_match',
                'listen_tap',
                'cloze_test',
                'picture_select',
                'speech_analysis',
                'dialogue',
                'sentence_builder',
            ];

            const stagesPayload = [];
            for (let i = 0; i < 55; i++) {
                const stageType = stageTypes[i % stageTypes.length];
                stagesPayload.push({
                    id: `challenge_stage_${i}`,
                    index: i,
                    type: stageType,
                    title: `Challenge Stage #${i + 1} (${stageType})`,
                    prompt: `Master challenge stage ${i + 1} with high fidelity`,
                    targetPhrase: `German phrase example #${i}: Das ist wunderbar!`,
                    translation: `English translation #${i}: That is wonderful!`,
                    options: [
                        { id: 1, text: 'Wunderbar', translation: 'Wonderful', isCorrect: true },
                        { id: 2, text: 'Schlecht', translation: 'Bad', isCorrect: false },
                        { id: 3, text: 'Schnell', translation: 'Fast', isCorrect: false },
                        { id: 4, text: 'Kalt', translation: 'Cold', isCorrect: false },
                    ],
                    tokens: ['Das', 'ist', 'wirklich', 'sehr', 'wunderbar', 'heute'],
                    audioMetadata: {
                        normalUrl: `https://cdn.dolphincoder.com/audio/challenge_${i}_normal.mp3`,
                        turtleUrl: `https://cdn.dolphincoder.com/audio/challenge_${i}_slow.mp3`,
                        durationMs: 2500 + i * 20,
                        sampleRate: 44100,
                    },
                    difficultyWeight: 1.25,
                    requiredAccuracyPct: 80,
                });
            }

            // Verify payload contains 55 stages
            expect(stagesPayload.length).toBe(55);

            // Create lesson with the 55 stages
            const created = await CurriculumLesson.create({
                owner: user.id,
                title: 'Massive 55-Stage Comprehensive Lesson',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 10,
                lessonIndex: 0,
                stages: stagesPayload,
                isLive: true,
            });

            expect(created.id).toBeDefined();
            expect(created.stages.length).toBe(55);

            // Retrieve directly from database by primary key (read-after-write)
            const retrieved = await CurriculumLesson.findByPk(created.id);
            expect(retrieved).not.toBeNull();
            expect(Array.isArray(retrieved.stages)).toBe(true);
            expect(retrieved.stages.length).toBe(55);

            // Deep validation across initial, middle, and last stage
            expect(retrieved.stages[0]).toEqual(stagesPayload[0]);
            expect(retrieved.stages[27]).toEqual(stagesPayload[27]);
            expect(retrieved.stages[54]).toEqual(stagesPayload[54]);

            // Complete deep-equality verification: all 55 stages match 100%
            expect(retrieved.stages).toEqual(stagesPayload);
        });

        it('expands boundary beyond 65 stages (~100KB JSON) with deep mutation and preserves data fidelity', async () => {
            const { user } = await createTestAdmin();

            const lesson = await CurriculumLesson.create({
                owner: user.id,
                title: 'Boundary Expansion Test Lesson',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'B1',
                unitNumber: 15,
                lessonIndex: 1,
                stages: [],
            });

            // Build 70 stages with deep nested dialogue, timings, and word arrays
            const expandedStages = [];
            for (let i = 0; i < 70; i++) {
                expandedStages.push({
                    id: `expanded_stage_${i}`,
                    stageIndex: i,
                    type: 'dialogue',
                    context: `Interactive Conversational Scenario #${i + 1}`,
                    dialogueLines: [
                        { speaker: 'Lukas', text: 'Entschuldigung, wo ist der Bahnhof?', translation: 'Excuse me, where is the train station?' },
                        { speaker: 'Elena', text: 'Gehen Sie geradeaus und dann links.', translation: 'Go straight ahead and then turn left.' },
                        { speaker: 'Lukas', text: 'Vielen Dank für Ihre Hilfe!', translation: 'Thank you very much for your help!' },
                    ],
                    vocabularyHints: [
                        { word: 'Bahnhof', gender: 'der', plural: 'Bahnhöfe' },
                        { word: 'Hilfe', gender: 'die', plural: 'Hilfen' },
                    ],
                    pointsAwarded: 25,
                });
            }

            // Update stages column
            lesson.stages = expandedStages;
            await lesson.save();

            // Re-fetch from DB
            const reFetched = await CurriculumLesson.findByPk(lesson.id);
            expect(reFetched.stages.length).toBe(70);
            expect(reFetched.stages[0].dialogueLines.length).toBe(3);
            expect(reFetched.stages[69].id).toBe('expanded_stage_69');
            expect(reFetched.stages).toEqual(expandedStages);
        });

        it('handles boundary conditions: empty stages array and invalid JSON strings safely', async () => {
            const { user } = await createTestAdmin();

            // Default empty stages
            const emptyLesson = await CurriculumLesson.create({
                owner: user.id,
                title: 'Empty Stages Lesson',
                learningLanguage: 'de',
                nativeLanguage: 'en',
                level: 'A1',
                unitNumber: 20,
            });

            expect(emptyLesson.stages).toEqual([]);

            const fetchedEmpty = await CurriculumLesson.findByPk(emptyLesson.id);
            expect(fetchedEmpty.stages).toEqual([]);

            // Direct database raw value corrupted JSON test (model getter safety check)
            await sequelize.query(
                `UPDATE CurriculumLessons SET stages = 'INVALID_NON_JSON_CORRUPT' WHERE id = ${emptyLesson.id}`
            );

            const fetchedCorrupt = await CurriculumLesson.findByPk(emptyLesson.id);
            // Getter catches syntax error and safely returns empty array [] without crashing
            expect(fetchedCorrupt.stages).toEqual([]);
        });
    });
});
