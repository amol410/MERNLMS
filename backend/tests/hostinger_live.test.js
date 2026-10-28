/**
 * Live Hostinger Database Latency and Integration Test Suite
 * DolphinCoder LMS - Production Verification
 *
 * Verifies live endpoints on https://dolphincoder.com:
 *   1. Base Nginx Ping (https://dolphincoder.com)
 *   2. Static App Version (https://dolphincoder.com/app_version.json)
 *   3. Auth Login & JWT generation for both Admin and Student roles
 *   4. Student & Admin Gamification Path queries (560 nodes, budget < 2000ms)
 *   5. Interactive Lesson Stages (lesson 1693: word_match, listen_tap, budget < 1000ms)
 *   6. User Gamification Status (oxygen, pearls, streak, budget < 1000ms)
 *   7. Leaderboard aggregation query (budget < 1000ms)
 *   8. Admin Curriculum Management & Live Status Toggle (budget < 1000ms)
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.LIVE_API_URL || 'https://dolphincoder.com';

const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@speedupexam.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@SpeedUp2024!',
};

const STUDENT_CREDENTIALS = {
  email: process.env.STUDENT_EMAIL || 'dmacaule111@gmail.com',
  password: process.env.STUDENT_PASSWORD || 'Amol0410@@@',
};

// High-precision HTTPS request helper
function liveRequest({ url, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const start = process.hrtime.bigint();
    let ttfbEnd = null;
    let totalEnd = null;
    let rawBody = '';

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'User-Agent': 'DolphinCoder-LiveJest/1.0',
          Accept: 'application/json, text/plain, */*',
          ...headers,
        },
        agent: false,
      },
      (res) => {
        ttfbEnd = process.hrtime.bigint();
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          rawBody += chunk;
        });

        res.on('end', () => {
          totalEnd = process.hrtime.bigint();
          const ttfbMs = Number(ttfbEnd - start) / 1e6;
          const totalMs = Number(totalEnd - start) / 1e6;

          let data = null;
          try {
            data = JSON.parse(rawBody);
          } catch (_) {
            data = rawBody;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            ttfbMs,
            totalMs,
            data,
            rawBody,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      const payload = typeof body === 'object' ? JSON.stringify(body) : body;
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

describe('🐬 DolphinCoder LMS - Live Hostinger Database & Integration Suite', () => {
  let adminToken = null;
  let studentToken = null;

  beforeAll(async () => {
    // Authenticate Admin
    const adminRes = await liveRequest({
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: ADMIN_CREDENTIALS,
    });
    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.data).toBeDefined();
    expect(adminRes.data.success).toBe(true);
    expect(adminRes.data.token).toBeDefined();
    adminToken = adminRes.data.token;

    // Authenticate Student
    const studentRes = await liveRequest({
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: STUDENT_CREDENTIALS,
    });
    expect(studentRes.statusCode).toBe(200);
    expect(studentRes.data).toBeDefined();
    expect(studentRes.data.success).toBe(true);
    expect(studentRes.data.token).toBeDefined();
    studentToken = studentRes.data.token;
  }, 25000);

  // 1. Base Nginx Ping
  describe('1. Base Infrastructure & Edge CDN', () => {
    test('Base Nginx Ping responds within 1000ms', async () => {
      const res = await liveRequest({ url: `${BASE_URL}/` });
      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
      expect(res.headers).toBeDefined();
    });

    test('Static App Version endpoint responds within 1000ms', async () => {
      const res = await liveRequest({ url: `${BASE_URL}/app_version.json` });
      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
    });
  });

  // 2. Authentication Verification
  describe('2. Authentication & JWT Generation Latency', () => {
    test('Admin login generates valid JWT under 1500ms with role "admin"', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: ADMIN_CREDENTIALS,
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1500);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.user.role).toBe('admin');
      expect(res.data.user.email).toBe(ADMIN_CREDENTIALS.email);
    });

    test('Student login generates valid JWT under 1500ms with role "student"', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: STUDENT_CREDENTIALS,
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1500);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.user.role).toBe('student');
      expect(res.data.user.email).toBe(STUDENT_CREDENTIALS.email);
    });
  });

  // 3. Student Experience & Database Integrity
  describe('3. Student Experience & Database Integrity', () => {
    test('Student Gamification Status responds under 1000ms with valid attributes', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/status`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.oxygen).toBe('number');
      expect(typeof res.data.pearls).toBe('number');
      expect(res.data.status).toBeDefined();
      expect(typeof res.data.status.streakCount).toBe('number');
      expect(typeof res.data.status.currentLeague).toBe('string');
    });

    test('Student Gamification Path queries 500+ nodes within 2000ms latency budget', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/path`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(2000);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.nodes)).toBe(true);
      expect(res.data.nodes.length).toBeGreaterThanOrEqual(500);

      // Validate node schema
      const sample = res.data.nodes[0];
      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('unitNumber');
      expect(sample).toHaveProperty('title');
      expect(sample).toHaveProperty('type');
    });

    test('Student Lesson 1693 Stage query verifies word_match and listen_tap under 1000ms', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1693`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
      expect(res.data.success).toBe(true);
      expect(res.data.lesson).toBeDefined();
      expect(res.data.lesson.id).toBe(1693);

      const stages = res.data.lesson.stages;
      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThanOrEqual(2);

      // Verify word_match interactive mechanics
      const wordMatch = stages.find((s) => s.type === 'word_match');
      expect(wordMatch).toBeDefined();
      expect(Array.isArray(wordMatch.pairs)).toBe(true);
      expect(wordMatch.pairs.length).toBeGreaterThanOrEqual(2);
      expect(wordMatch.pairs[0]).toHaveProperty('target');
      expect(wordMatch.pairs[0]).toHaveProperty('native');

      // Verify listen_tap interactive mechanics
      const listenTap = stages.find((s) => s.type === 'listen_tap');
      expect(listenTap).toBeDefined();
      expect(typeof listenTap.targetSentence).toBe('string');
      expect(listenTap.targetSentence.length).toBeGreaterThan(0);
      expect(Array.isArray(listenTap.tokens)).toBe(true);
      expect(listenTap.tokens.length).toBeGreaterThanOrEqual(2);
    });

    test('Student Leaderboard aggregation responds under 1000ms', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/leaderboard`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.league).toBe('string');
      expect(Array.isArray(res.data.leaderboard)).toBe(true);
      expect(res.data.leaderboard.length).toBeGreaterThan(0);
      expect(res.data.leaderboard[0]).toHaveProperty('rank');
      expect(res.data.leaderboard[0]).toHaveProperty('name');
      expect(res.data.leaderboard[0]).toHaveProperty('xp');
    });
  });

  // 4. Admin Management & Write Operations
  describe('4. Admin Management Operations', () => {
    test('Admin Curriculum Units Summary responds under 1500ms with 30+ units', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/curriculum/units`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1500);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.units)).toBe(true);
      expect(res.data.units.length).toBeGreaterThanOrEqual(30);
    });

    test('Admin Gamification Path responds under 2000ms with 500+ nodes', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/path`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(2000);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.nodes)).toBe(true);
      expect(res.data.nodes.length).toBeGreaterThanOrEqual(500);
    });

    test('Admin Live Status Toggle executes DB write and responds under 1000ms', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/curriculum/lessons/1693/live`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isLive: true },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(1000);
      expect(res.data.success).toBe(true);
      expect(res.data.isLive).toBe(true);
      expect(res.data.lesson).toBeDefined();
    });
  });
});
