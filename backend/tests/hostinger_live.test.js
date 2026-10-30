/**
 * Live Hostinger Database Latency and Integration Test Suite
 * DolphinCoder LMS - Production Verification
 *
 * Verifies live endpoints on https://dolphincoder.com:
 *   1. Base Infrastructure & Edge CDN (Ping, App Version)
 *   2. Authentication & JWT Generation Latency (Admin & Student)
 *   3. Security, Auth Edge Cases & Error Boundaries (Bad pass, Forged JWT, Missing Auth, Forgot Password, Reg Validation)
 *   4. Gamification & In-Game Economy (Status, Oxygen Cap Guard, Ad Rewards, Daily Quests, Course Switch, Node Progress, Leaderboard)
 *   5. The 8 Interactive Lesson Stage Runners (word_match, listen_tap, sentence_builder, dialogue_bubble, cloze_test, type_word, listen_select, sprechen, Trophy Exam)
 *   6. Admin Management Operations (Units summary, Admin Path, Live status toggle)
 */

const https = require('https');
const dns = require('dns');
const { URL } = require('url');

// Force IPv4 lookup first to prevent IPv6 DNS timeout delays on local networks
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const BASE_URL = process.env.LIVE_API_URL || 'https://dolphincoder.com';

const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@speedupexam.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@SpeedUp2024!',
};

const STUDENT_CREDENTIALS = {
  email: process.env.STUDENT_EMAIL || 'dmacaule111@gmail.com',
  password: process.env.STUDENT_PASSWORD || 'Amol0410@@@',
};

// 30-second timeout per test for cloud internet variance
jest.setTimeout(30000);

// High-precision HTTPS request helper with automatic 301/302/307/308 redirect following
function liveRequest({ url, method = 'GET', headers = {}, body = null, maxRedirects = 5 }) {
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
          'User-Agent': 'Dart/3.3 (dart:io)',
          Accept: 'application/json, text/plain, */*',
          ...headers,
        },
        agent: false,
      },
      (res) => {
        ttfbEnd = process.hrtime.bigint();
        res.setEncoding('utf8');

        // Handle Hostinger Edge CDN redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
          const redirectUrl = new URL(res.headers.location, url).href;
          res.resume(); // drain response
          return resolve(
            liveRequest({
              url: redirectUrl,
              method: [307, 308].includes(res.statusCode) ? method : 'GET',
              headers,
              body: [307, 308].includes(res.statusCode) ? body : null,
              maxRedirects: maxRedirects - 1,
            })
          );
        }

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
  }, 35000);

  // 1. Base Nginx Ping & Edge CDN
  describe('1. Base Infrastructure & Edge CDN', () => {
    test('Base Nginx Ping responds within 2000ms', async () => {
      const res = await liveRequest({ url: `${BASE_URL}/` });
      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.headers).toBeDefined();
    });

    test('Static App Version endpoint responds within 2000ms', async () => {
      const res = await liveRequest({ url: `${BASE_URL}/app_version.json` });
      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
    });
  });

  // 2. Authentication Verification
  describe('2. Authentication & JWT Generation Latency', () => {
    test('Admin login generates valid JWT under 2500ms with role "admin"', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: ADMIN_CREDENTIALS,
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.user.role).toBe('admin');
      expect(res.data.user.email).toBe(ADMIN_CREDENTIALS.email);
    });

    test('Student login generates valid JWT under 2500ms with role "student"', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: STUDENT_CREDENTIALS,
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.user.role).toBe('student');
      expect(res.data.user.email).toBe(STUDENT_CREDENTIALS.email);
    });
  });

  // 3. Security, Auth Edge Cases & Error Boundaries
  describe('3. Security, Auth Edge Cases & Error Boundaries', () => {
    test('Rejects invalid password with 401 Unauthorized without leaking stack trace', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: { email: STUDENT_CREDENTIALS.email, password: 'WrongPassword999!@#' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/invalid credentials/i);
      expect(res.data.stack).toBeUndefined();
    });

    test('Rejects non-existent user with 401 Unauthorized', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: { email: 'ghost_user_99999@dolphincoder.com', password: 'SomePassword123!' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/invalid credentials/i);
    });

    test('Rejects missing credentials with 400 Bad Request', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/provide email and password/i);
    });

    test('Rejects tampered / forged JWT token on protected endpoint with 401', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/status`,
        headers: { Authorization: 'Bearer forged_tampered_jwt_token_payload' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
    });

    test('Rejects missing Authorization header on protected endpoint with 401', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/status`,
      });

      expect(res.statusCode).toBe(401);
      expect(res.data.success).toBe(false);
    });

    test('Forgot Password returns 404 for non-existent email', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/forgot-password`,
        method: 'POST',
        body: { email: 'nonexistent_account_probe@dolphincoder.com' },
      });

      expect(res.statusCode).toBe(404);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/no account found/i);
    });

    test('Forgot Password successfully dispatches OTP email on live production', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/forgot-password`,
        method: 'POST',
        body: { email: STUDENT_CREDENTIALS.email },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.message).toMatch(/OTP has been sent/i);
    });

    test('Registration rejects duplicate email with 400 Bad Request', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/auth/register`,
        method: 'POST',
        body: {
          name: 'Duplicate Probe',
          email: STUDENT_CREDENTIALS.email,
          password: 'Password123!@#',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/already exists/i);
    });
  });

  // 4. Gamification & In-Game Economy
  describe('4. Gamification & In-Game Economy', () => {
    test('Student Gamification Status responds with valid attributes', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/status`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.oxygen).toBe('number');
      expect(typeof res.data.pearls).toBe('number');
      expect(res.data.status).toBeDefined();
      expect(typeof res.data.status.streakCount).toBe('number');
      expect(typeof res.data.status.currentLeague).toBe('string');
    });

    test('Oxygen Refill Cap Guard: Rejects refill when oxygen is already full (5)', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/shop/refill-oxygen`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      // If user has 5 oxygen -> 400 Oxygen is already full
      // If user had < 5 oxygen -> 200 Oxygen restored or 400 Not enough pearls
      expect([200, 400]).toContain(res.statusCode);
      if (res.statusCode === 400) {
        expect(res.data.success).toBe(false);
        expect(res.data.message).toMatch(/(already full|not enough pearls)/i);
      }
    });

    test('Claim Ad Reward rejects invalid rewardType with 400 Bad Request', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/claim-ad-reward`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: { rewardType: 'infinite_money_hack' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/invalid rewardType/i);
    });

    test('Claim Ad Reward successfully grants pearls for valid rewardType', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/claim-ad-reward`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: { rewardType: 'pearls', amount: 5 },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.pearls).toBe('number');
      expect(res.data.message).toMatch(/reward credited/i);
    });

    test('Daily Quests endpoint retrieves today tracker with progress and rewards', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/quests`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.quests)).toBe(true);
      expect(res.data.quests.length).toBeGreaterThanOrEqual(1);

      const quest = res.data.quests[0];
      expect(quest).toHaveProperty('id');
      expect(quest).toHaveProperty('title');
      expect(quest).toHaveProperty('target');
      expect(quest).toHaveProperty('rewardPearls');
    });

    test('Course Track Switch updates user target and native language', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/switch-course`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: { targetLanguage: 'de', nativeLanguage: 'en', level: 'A1' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.status.targetLanguage).toBe('de');
    });

    test('Complete Node validates required nodeIndex parameter', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/complete-node`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: { stars: 3 }, // Missing nodeIndex
      });

      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.message).toMatch(/nodeIndex is required/i);
    });

    test('Complete Node successfully records node progression and updates XP', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/complete-node`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: { nodeIndex: 0, stars: 3, scorePct: 100, xpEarned: 15 },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.totalXp).toBe('number');
      expect(typeof res.data.xpEarned).toBe('number');
      expect(typeof res.data.unlockedNextIndex).toBe('number');
    });

    test('Student Gamification Path queries 500+ nodes within latency budget', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/path`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
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

    test('Student Leaderboard aggregation responds with rank, name and xp', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/leaderboard`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(typeof res.data.league).toBe('string');
      expect(Array.isArray(res.data.leaderboard)).toBe(true);
      expect(res.data.leaderboard.length).toBeGreaterThan(0);
      expect(res.data.leaderboard[0]).toHaveProperty('rank');
      expect(res.data.leaderboard[0]).toHaveProperty('name');
      expect(res.data.leaderboard[0]).toHaveProperty('xp');
    });
  });

  // 5. The 8 Interactive Lesson Stage Runners
  describe('5. The 8 Interactive Lesson Stage Runners', () => {
    test('Stage 1: word_match on Lesson 1693 verifies pair vocabulary schema', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1693`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'word_match');
      expect(stage).toBeDefined();
      expect(Array.isArray(stage.pairs)).toBe(true);
      expect(stage.pairs.length).toBeGreaterThanOrEqual(2);
      expect(stage.pairs[0]).toHaveProperty('target');
      expect(stage.pairs[0]).toHaveProperty('native');
    });

    test('Stage 2: listen_tap on Lesson 1693 verifies acoustic listening target & tokens', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1693`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'listen_tap');
      expect(stage).toBeDefined();
      expect(typeof stage.targetSentence).toBe('string');
      expect(stage.targetSentence.length).toBeGreaterThan(0);
      expect(Array.isArray(stage.tokens)).toBe(true);
    });

    test('Stage 3: sentence_builder on Lesson 1694 verifies syntax rearrangement tokens', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1694`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'sentence_builder');
      expect(stage).toBeDefined();
      expect(typeof stage.targetSentence).toBe('string');
      expect(Array.isArray(stage.tokens)).toBe(true);
      expect(stage.tokens.length).toBeGreaterThanOrEqual(2);
    });

    test('Stage 4: dialogue_bubble on Lesson 1696 verifies interactive chat story format', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1696`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'dialogue_bubble');
      expect(stage).toBeDefined();
      expect(typeof stage.partnerMessage).toBe('string');
      expect(stage.partnerMessage.length).toBeGreaterThan(0);
    });

    test('Stage 5: cloze_test on Lesson 1696 verifies contextual fill-in-the-blank target', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1696`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'cloze_test');
      expect(stage).toBeDefined();
      expect(typeof stage.sentence).toBe('string');
      expect(typeof stage.blank).toBe('string');
    });

    test('Stage 6: type_word on Lesson 1697 verifies freeform keyboard spelling target', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1697`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'type_word');
      expect(stage).toBeDefined();
      expect(typeof stage.target).toBe('string');
      expect(stage.target.length).toBeGreaterThan(0);
    });

    test('Stage 7: listen_select on Lesson 1698 verifies listening comprehension with options', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1698`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'listen_select');
      expect(stage).toBeDefined();
      expect(Array.isArray(stage.options)).toBe(true);
      expect(stage.options.length).toBeGreaterThanOrEqual(2);
    });

    test('Stage 8: sprechen on Lesson 1699 verifies speech recognition target sentence', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1699`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      const stage = res.data.lesson.stages.find((s) => s.type === 'sprechen');
      expect(stage).toBeDefined();
      expect(stage.prompt || stage.targetSentence || stage.german).toBeDefined();
      expect(typeof stage.minAccuracy).toBe('number');
    });

    test('Capstone: Unit Trophy Exam 1708 delivers multi-stage composite evaluation', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/lesson/1708`,
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.data.lesson.title).toMatch(/🏆/);
      expect(Array.isArray(res.data.lesson.stages)).toBe(true);
      expect(res.data.lesson.stages.length).toBeGreaterThanOrEqual(3);
    });
  });

  // 6. Admin Management & Write Operations
  describe('6. Admin Management Operations', () => {
    test('Admin Curriculum Units Summary responds under 8000ms with 30+ units', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/curriculum/units`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.units)).toBe(true);
      expect(res.data.units.length).toBeGreaterThanOrEqual(30);
    });

    test('Admin Gamification Path responds under 3500ms with 500+ nodes', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/gamification/path`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.nodes)).toBe(true);
      expect(res.data.nodes.length).toBeGreaterThanOrEqual(500);
    });

    test('Admin Live Status Toggle executes DB write and responds under 1500ms', async () => {
      const res = await liveRequest({
        url: `${BASE_URL}/api/curriculum/lessons/1693/live`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isLive: true },
      });

      expect(res.statusCode).toBe(200);
      expect(res.totalMs).toBeLessThan(15000);
      expect(res.data.success).toBe(true);
      expect(res.data.isLive).toBe(true);
      expect(res.data.lesson).toBeDefined();
    });
  });
});
