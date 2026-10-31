const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const User = require('../models/User');
const KaraokeAudio = require('../models/KaraokeAudio');
const { createTestUser, sequelize } = require('./setup');
const { getClientDate, toClientLocalDate, getClientDayUtcBounds } = require('../utils/dateHelper');

// Custom binary parser for Supertest to capture raw Buffers from streaming endpoints
const binaryParser = (res, callback) => {
    const data = [];
    res.on('data', chunk => data.push(chunk));
    res.on('end', () => callback(null, Buffer.concat(data)));
};

describe('Phase 1 Correctness & Production Safety Test Suite', () => {

    /* ======================================================================
     * 1. Server-Authoritative Oxygen Deduction
     * ====================================================================== */
    describe('POST /api/gamification/deduct-oxygen', () => {
        it('requires authentication (returns 401 when no token is provided)', async () => {
            const res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects an invalid authorization token', async () => {
            const res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', 'Bearer invalid.jwt.token')
                .send({});

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('decrements oxygen by 1 and returns updated count', async () => {
            const { user, token } = await createTestUser({ oxygen: 5, lastOxygenRefill: null });

            const res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(4);
            expect(res.body.message).toBe('Oxygen deducted successfully');

            // Verify persistence in SQLite
            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(4);
            // Verify lastOxygenRefill was set since oxygen dropped below 5
            expect(updatedUser.lastOxygenRefill).not.toBeNull();
        });

        it('handles sequential deductions correctly across repeated mistakes', async () => {
            const { user, token } = await createTestUser({ oxygen: 3 });

            // 1st deduction: 3 -> 2
            let res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.oxygen).toBe(2);

            // 2nd deduction: 2 -> 1
            res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.oxygen).toBe(1);

            // 3rd deduction: 1 -> 0
            res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.oxygen).toBe(0);

            const finalUser = await User.findByPk(user.id);
            expect(finalUser.oxygen).toBe(0);
        });

        it('enforces floor at 0 (never drops into negative numbers)', async () => {
            const { user, token } = await createTestUser({ oxygen: 0 });

            // Deduct when already at 0
            const res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(0);

            const dbUser = await User.findByPk(user.id);
            expect(dbUser.oxygen).toBe(0);
        });

        it('performs auto-refill catch-up before deducting oxygen if 30+ minutes elapsed', async () => {
            // User had 2 oxygen and 65 minutes passed (2 refill units = +2 bubbles -> 4 bubbles)
            // Then deduct 1 = 3 bubbles final
            const sixtyFiveMinutesAgo = new Date(Date.now() - 65 * 60 * 1000);
            const { user, token } = await createTestUser({
                oxygen: 2,
                lastOxygenRefill: sixtyFiveMinutesAgo,
            });

            const res = await request(app)
                .post('/api/gamification/deduct-oxygen')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.oxygen).toBe(3); // (2 + 2) - 1 = 3

            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.oxygen).toBe(3);
        });
    });

    /* ======================================================================
     * 2. Anti-Cheat Streak Date Anchoring (backend/utils/dateHelper.js)
     * ====================================================================== */
    describe('Anti-Cheat Streak Date Anchoring (getClientDate)', () => {
        const getShiftedDate = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return toClientLocalDate(d);
        };

        it('returns server-derived date when req is null or undefined', () => {
            const date = getClientDate(null);
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(date).toBe(toClientLocalDate(new Date()));
        });

        it('returns server-derived date when req has no explicit client date', () => {
            const mockReq = { headers: {} };
            const date = getClientDate(mockReq);
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(date).toBe(toClientLocalDate(new Date(), mockReq));
        });

        it('accepts explicit client date when matching today', () => {
            const today = getShiftedDate(0);
            const mockReq = { headers: { 'x-client-date': today } };
            expect(getClientDate(mockReq)).toBe(today);
        });

        it('accepts valid timezone boundaries: 1 calendar day in the past (yesterday)', () => {
            const yesterday = getShiftedDate(-1);
            const mockReq = { headers: { 'x-client-date': yesterday } };
            expect(getClientDate(mockReq)).toBe(yesterday);
        });

        it('accepts valid timezone boundaries: 1 calendar day in the future (tomorrow)', () => {
            const tomorrow = getShiftedDate(1);
            const mockReq = { headers: { 'x-client-date': tomorrow } };
            expect(getClientDate(mockReq)).toBe(tomorrow);
        });

        it('rejects spoofed past dates (> 1 day behind) and reverts to server date', () => {
            const twoDaysAgo = getShiftedDate(-2);
            const mockReq = { headers: { 'x-client-date': twoDaysAgo } };
            const today = toClientLocalDate(new Date(), mockReq);
            expect(getClientDate(mockReq)).toBe(today);

            // Historical cheating attempt: 30 days ago
            const monthAgo = getShiftedDate(-30);
            const mockReq2 = { headers: { 'x-client-date': monthAgo } };
            expect(getClientDate(mockReq2)).toBe(today);

            // Years ago
            const yearsAgoReq = { headers: { 'x-client-date': '2020-01-01' } };
            expect(getClientDate(yearsAgoReq)).toBe(today);
        });

        it('rejects spoofed future dates (> 1 day ahead) and reverts to server date', () => {
            const twoDaysFuture = getShiftedDate(2);
            const mockReq = { headers: { 'x-client-date': twoDaysFuture } };
            const today = toClientLocalDate(new Date(), mockReq);
            expect(getClientDate(mockReq)).toBe(today);

            // Distant future cheat attempt
            const farFutureReq = { headers: { 'x-client-date': '2030-12-31' } };
            expect(getClientDate(farFutureReq)).toBe(today);
        });

        it('verifies client dates from alternate input channels (body.clientDate, body.activityDate, query.clientDate)', () => {
            const today = getShiftedDate(0);
            const serverToday = toClientLocalDate(new Date());

            // 1. req.body.clientDate
            expect(getClientDate({ body: { clientDate: today } })).toBe(today);
            expect(getClientDate({ body: { clientDate: '2020-01-01' } })).toBe(serverToday);

            // 2. req.body.activityDate
            expect(getClientDate({ body: { activityDate: today } })).toBe(today);
            expect(getClientDate({ body: { activityDate: '2099-01-01' } })).toBe(serverToday);

            // 3. req.query.clientDate
            expect(getClientDate({ query: { clientDate: today } })).toBe(today);
            expect(getClientDate({ query: { clientDate: '2024-05-10' } })).toBe(serverToday);
        });

        it('rejects malformed date formats and SQL injection attempts', () => {
            const serverToday = toClientLocalDate(new Date());
            const malformedInputs = [
                'invalid-date',
                '2026/01/01',
                '2026-1-1',
                '2026-13-45',
                'DROP TABLE users;',
                '',
                'null',
                'undefined',
            ];

            for (const input of malformedInputs) {
                const req = { headers: { 'x-client-date': input } };
                expect(getClientDate(req)).toBe(serverToday);
            }
        });

        it('correctly calculates client day UTC bounds with getClientDayUtcBounds', () => {
            const req = { headers: { 'x-timezone-offset': '-330' } }; // IST UTC+5:30
            const bounds = getClientDayUtcBounds('2026-11-01', req);

            // 2026-11-01 00:00:00 IST = 2026-10-31 18:30:00 UTC
            expect(bounds.startUtc.toISOString()).toBe('2026-10-31T18:30:00.000Z');
            // 2026-11-01 23:59:59.999 IST = 2026-11-01 18:29:59.999 UTC
            expect(bounds.endUtc.toISOString()).toBe('2026-11-01T18:29:59.999Z');
        });
    });

    /* ======================================================================
     * 3. Memory-Safe SQL Range Audio Streaming (streamAudioFromDb)
     * ====================================================================== */
    describe('Memory-Safe SQL Range Audio Streaming (GET /api/notes/audio/db/:id)', () => {
        let testAudioRecord;
        const sampleAudioBytes = Buffer.from(
            'DolphinCoder-Karaoke-Audio-Stream-Test-Payload-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-!@#$%^&*()'
        );

        beforeAll(async () => {
            testAudioRecord = await KaraokeAudio.create({
                filename: 'unit_test_audio.mp3',
                mimeType: 'audio/mpeg',
                audioData: sampleAudioBytes,
                fileSize: sampleAudioBytes.length,
            });
        });

        it('validates audio ID and rejects non-numeric or non-positive IDs with HTTP 400', async () => {
            // Non-numeric ID
            let res = await request(app).get('/api/notes/audio/db/abc');
            expect(res.status).toBe(400);
            expect(res.text).toBe('Invalid audio ID');

            // Zero ID
            res = await request(app).get('/api/notes/audio/db/0');
            expect(res.status).toBe(400);
            expect(res.text).toBe('Invalid audio ID');

            // Negative ID
            res = await request(app).get('/api/notes/audio/db/-42');
            expect(res.status).toBe(400);
            expect(res.text).toBe('Invalid audio ID');
        });

        it('returns HTTP 404 when audio track does not exist in database', async () => {
            const res = await request(app).get('/api/notes/audio/db/999999');
            expect(res.status).toBe(404);
            expect(res.text).toBe('Audio track not found in database');
        });

        it('serves full audio track with HTTP 200 when no Range header is sent', async () => {
            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .buffer()
                .parse(binaryParser);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('audio/mpeg');
            expect(Number(res.headers['content-length'])).toBe(sampleAudioBytes.length);
            expect(res.headers['accept-ranges']).toBe('bytes');
            expect(res.headers['cache-control']).toContain('public');
            expect(Buffer.compare(res.body, sampleAudioBytes)).toBe(0);
        });

        it('streams a defined byte range with HTTP 206 Partial Content', async () => {
            const start = 0;
            const end = 19;
            const expectedLength = (end - start) + 1; // 20 bytes
            const expectedSlice = sampleAudioBytes.subarray(start, end + 1);

            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', `bytes=${start}-${end}`)
                .buffer()
                .parse(binaryParser);

            expect(res.status).toBe(206);
            expect(res.headers['content-range']).toBe(`bytes ${start}-${end}/${sampleAudioBytes.length}`);
            expect(Number(res.headers['content-length'])).toBe(expectedLength);
            expect(res.headers['content-type']).toBe('audio/mpeg');
            expect(res.headers['accept-ranges']).toBe('bytes');
            expect(Buffer.compare(res.body, expectedSlice)).toBe(0);
        });

        it('streams an open-ended range request (e.g. bytes=50-)', async () => {
            const start = 50;
            const end = sampleAudioBytes.length - 1;
            const expectedLength = (end - start) + 1;
            const expectedSlice = sampleAudioBytes.subarray(start, end + 1);

            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', `bytes=${start}-`)
                .buffer()
                .parse(binaryParser);

            expect(res.status).toBe(206);
            expect(res.headers['content-range']).toBe(`bytes ${start}-${end}/${sampleAudioBytes.length}`);
            expect(Number(res.headers['content-length'])).toBe(expectedLength);
            expect(Buffer.compare(res.body, expectedSlice)).toBe(0);
        });

        it('streams a single byte range request (e.g. bytes=0-0)', async () => {
            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', 'bytes=0-0')
                .buffer()
                .parse(binaryParser);

            expect(res.status).toBe(206);
            expect(res.headers['content-range']).toBe(`bytes 0-0/${sampleAudioBytes.length}`);
            expect(Number(res.headers['content-length'])).toBe(1);
            expect(res.body[0]).toBe(sampleAudioBytes[0]);
        });

        it('returns HTTP 416 Requested Range Not Satisfiable on out-of-bounds start', async () => {
            const outOfBoundsStart = sampleAudioBytes.length + 50;
            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', `bytes=${outOfBoundsStart}-${outOfBoundsStart + 10}`);

            expect(res.status).toBe(416);
            expect(res.headers['content-range']).toBe(`bytes */${sampleAudioBytes.length}`);
            expect(res.text).toBe('Requested Range Not Satisfiable');
        });

        it('returns HTTP 416 Requested Range Not Satisfiable when end exceeds file length', async () => {
            const start = 10;
            const outOfBoundsEnd = sampleAudioBytes.length + 500;
            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', `bytes=${start}-${outOfBoundsEnd}`);

            expect(res.status).toBe(416);
            expect(res.headers['content-range']).toBe(`bytes */${sampleAudioBytes.length}`);
            expect(res.text).toBe('Requested Range Not Satisfiable');
        });

        it('returns HTTP 416 Requested Range Not Satisfiable when start > end', async () => {
            const res = await request(app)
                .get(`/api/notes/audio/db/${testAudioRecord.id}`)
                .set('Range', 'bytes=70-20');

            expect(res.status).toBe(416);
            expect(res.headers['content-range']).toBe(`bytes */${sampleAudioBytes.length}`);
            expect(res.text).toBe('Requested Range Not Satisfiable');
        });
    });

    /* ======================================================================
     * 4. Production Safety Verification: Page.sync({ alter: true }) Removal
     * ====================================================================== */
    describe('Production Safety Verification', () => {
        it('ensures backend/models/Page.js does NOT contain { alter: true }', () => {
            const pageModelContent = fs.readFileSync(path.join(__dirname, '../models/Page.js'), 'utf8');
            expect(pageModelContent).not.toMatch(/Page\.sync\(\s*\{\s*alter\s*:\s*true\s*\}\s*\)/);
        });

        it('ensures backend/server.js does NOT contain { alter: true } in Page sync', () => {
            const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
            expect(serverContent).not.toMatch(/Page\.sync\(\s*\{\s*alter\s*:\s*true\s*\}\s*\)/);
        });
    });
});
