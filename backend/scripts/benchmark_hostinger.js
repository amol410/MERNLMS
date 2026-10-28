#!/usr/bin/env node

/**
 * Live Hostinger Database & API Benchmark Test Suite
 * DolphinCoder LMS - High-Precision Latency and Integrity Benchmark
 *
 * Measures:
 *   - DNS Lookup Time
 *   - SSL/TLS Handshake Duration
 *   - Time to First Byte (TTFB)
 *   - Total Request/Response Latency
 *   - Database Response Integrity (560+ lesson nodes, interactive stages, word_match, listen_tap)
 *   - Both Student and Admin user roles
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.LIVE_API_URL || 'https://dolphincoder.com';
const ITERATIONS = parseInt(process.env.BENCHMARK_RUNS || '3', 10);

const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@speedupexam.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@SpeedUp2024!',
};

const STUDENT_CREDENTIALS = {
  email: process.env.STUDENT_EMAIL || 'dmacaule111@gmail.com',
  password: process.env.STUDENT_PASSWORD || 'Amol0410@@@',
};

// Colors for terminal formatting
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgDark: '\x1b[100m',
};

/**
 * Measure single HTTP/HTTPS request with microsecond precision via hrtime.bigint
 */
function measureRequest({ url, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const start = process.hrtime.bigint();
    let dnsEnd = null;
    let sslEnd = null;
    let ttfbEnd = null;
    let totalEnd = null;
    let responseData = '';

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'User-Agent': 'DolphinCoder-LiveBenchmark/1.0',
          Accept: 'application/json, text/plain, */*',
          ...headers,
        },
        agent: false, // Fresh socket per request for genuine DNS/SSL metrics
      },
      (res) => {
        ttfbEnd = process.hrtime.bigint();
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          totalEnd = process.hrtime.bigint();

          const dnsMs = dnsEnd ? Number(dnsEnd - start) / 1e6 : 0;
          const sslMs = sslEnd && dnsEnd ? Number(sslEnd - dnsEnd) / 1e6 : (sslEnd ? Number(sslEnd - start) / 1e6 : 0);
          const ttfbMs = ttfbEnd ? Number(ttfbEnd - start) / 1e6 : 0;
          const totalMs = totalEnd ? Number(totalEnd - start) / 1e6 : 0;

          let parsedBody = null;
          try {
            parsedBody = JSON.parse(responseData);
          } catch (_) {
            parsedBody = responseData;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            dnsMs,
            sslMs,
            ttfbMs,
            totalMs,
            data: parsedBody,
            rawBody: responseData,
          });
        });
      }
    );

    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        dnsEnd = process.hrtime.bigint();
      });
      socket.on('secureConnect', () => {
        sslEnd = process.hrtime.bigint();
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      const payload = typeof body === 'object' ? JSON.stringify(body) : body;
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

/**
 * Rate performance based on total latency in ms
 */
function getRating(ms) {
  if (ms < 200) return { label: 'Excellent', color: COLORS.green, icon: '⚡' };
  if (ms < 500) return { label: 'Good', color: COLORS.cyan, icon: '🟢' };
  if (ms < 1000) return { label: 'Fair', color: COLORS.yellow, icon: '🟡' };
  return { label: 'Slow', color: COLORS.red, icon: '🔴' };
}

/**
 * Execute multiple iterations of an endpoint test
 */
async function benchmarkEndpoint(config) {
  const runs = [];
  let integrityPassed = false;
  let integrityDetails = '';

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const res = await measureRequest(config);
      runs.push(res);

      if (i === 0 && config.validator) {
        try {
          const validation = config.validator(res);
          integrityPassed = validation.passed;
          integrityDetails = validation.details;
        } catch (vErr) {
          integrityPassed = false;
          integrityDetails = `Validator exception: ${vErr.message}`;
        }
      }
    } catch (err) {
      runs.push({
        statusCode: 0,
        dnsMs: 0,
        sslMs: 0,
        ttfbMs: 0,
        totalMs: 0,
        error: err.message,
      });
    }
    // Small pause between runs to avoid rate limiting
    if (i < ITERATIONS - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  const validRuns = runs.filter((r) => r.statusCode === 200 || r.statusCode === 201 || (config.allowStatus && config.allowStatus(r.statusCode)));
  const totals = validRuns.map((r) => r.totalMs);
  const ttfbs = validRuns.map((r) => r.ttfbMs);
  const dnss = validRuns.map((r) => r.dnsMs);
  const ssls = validRuns.map((r) => r.sslMs);

  const min = totals.length > 0 ? Math.min(...totals) : 0;
  const max = totals.length > 0 ? Math.max(...totals) : 0;
  const avg = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const avgTtfb = ttfbs.length > 0 ? ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length : 0;
  const avgDns = dnss.length > 0 ? dnss.reduce((a, b) => a + b, 0) / dnss.length : 0;
  const avgSsl = ssls.length > 0 ? ssls.reduce((a, b) => a + b, 0) / ssls.length : 0;

  return {
    name: config.name,
    category: config.category,
    role: config.role || 'Public',
    endpoint: config.url.replace(BASE_URL, ''),
    method: config.method || 'GET',
    min,
    max,
    avg,
    avgTtfb,
    avgDns,
    avgSsl,
    integrityPassed,
    integrityDetails,
    sampleData: validRuns[0]?.data,
    statusCode: validRuns[0]?.statusCode || 0,
    serverHeader: validRuns[0]?.headers?.server || 'N/A',
    hcdnUpstreamRt: validRuns[0]?.headers?.['x-hcdn-upstream-rt'] || 'N/A',
    runsCount: validRuns.length,
  };
}

/**
 * Main Benchmark Runner
 */
async function runLiveBenchmark() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}  🐬 DOLPHINCODER LMS - HOSTINGER LIVE DATABASE LATENCY & INTEGRITY BENCHMARK${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);
  console.log(`${COLORS.gray}Target Host:       ${COLORS.reset}${BASE_URL}`);
  console.log(`${COLORS.gray}Iterations/Endpoint:${COLORS.reset} ${ITERATIONS} runs`);
  console.log(`${COLORS.gray}Timing Engine:     ${COLORS.reset}process.hrtime.bigint() [Microsecond Precision]`);
  console.log(`${COLORS.gray}Test Accounts:     ${COLORS.reset}Admin (${ADMIN_CREDENTIALS.email}) & Student (${STUDENT_CREDENTIALS.email})`);
  console.log(`${COLORS.gray}Started At:        ${COLORS.reset}${new Date().toISOString()}\n`);

  // Phase 1: Authentication
  console.log(`${COLORS.bold}🔑 Phase 1: Authenticating Test Accounts...${COLORS.reset}`);

  let adminToken = null;
  let studentToken = null;

  try {
    const adminRes = await measureRequest({
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: ADMIN_CREDENTIALS,
    });
    if (adminRes.statusCode === 200 && adminRes.data?.token) {
      adminToken = adminRes.data.token;
      console.log(`   ${COLORS.green}✔ Admin Authenticated${COLORS.reset} [Latency: ${adminRes.totalMs.toFixed(1)}ms, Role: ${adminRes.data.user.role}]`);
    } else {
      console.log(`   ${COLORS.red}✖ Admin Auth Failed${COLORS.reset} (Status: ${adminRes.statusCode})`);
    }
  } catch (err) {
    console.log(`   ${COLORS.red}✖ Admin Auth Error: ${err.message}${COLORS.reset}`);
  }

  try {
    const studentRes = await measureRequest({
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: STUDENT_CREDENTIALS,
    });
    if (studentRes.statusCode === 200 && studentRes.data?.token) {
      studentToken = studentRes.data.token;
      console.log(`   ${COLORS.green}✔ Student Authenticated${COLORS.reset} [Latency: ${studentRes.totalMs.toFixed(1)}ms, Role: ${studentRes.data.user.role}]`);
    } else {
      console.log(`   ${COLORS.red}✖ Student Auth Failed${COLORS.reset} (Status: ${studentRes.statusCode})`);
    }
  } catch (err) {
    console.log(`   ${COLORS.red}✖ Student Auth Error: ${err.message}${COLORS.reset}`);
  }

  // Phase 2: Define Test Matrix
  const testMatrix = [
    // 1. Base Nginx Ping
    {
      name: 'Base Nginx Ping',
      category: 'Infrastructure',
      role: 'Public',
      url: `${BASE_URL}/`,
      method: 'GET',
      validator: (res) => ({
        passed: res.statusCode === 200,
        details: `Nginx Server: ${res.headers.server || 'hcdn'}, Code: ${res.statusCode}`,
      }),
    },

    // 2. Static App Version
    {
      name: 'Static App Version',
      category: 'Static Asset',
      role: 'Public',
      url: `${BASE_URL}/app_version.json`,
      method: 'GET',
      allowStatus: (s) => s === 200,
      validator: (res) => ({
        passed: res.statusCode === 200,
        details: `Status ${res.statusCode}, Content-Type: ${res.headers['content-type']?.split(';')[0]}`,
      }),
    },

    // 3. Admin Login & JWT
    {
      name: 'Admin Login & JWT',
      category: 'Auth / Crypto',
      role: 'Admin',
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: ADMIN_CREDENTIALS,
      validator: (res) => ({
        passed: res.statusCode === 200 && !!res.data?.token && res.data?.user?.role === 'admin',
        details: `JWT generated, User: ${res.data?.user?.name || 'Admin'} (Role: ${res.data?.user?.role})`,
      }),
    },

    // 4. Student Login & JWT
    {
      name: 'Student Login & JWT',
      category: 'Auth / Crypto',
      role: 'Student',
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: STUDENT_CREDENTIALS,
      validator: (res) => ({
        passed: res.statusCode === 200 && !!res.data?.token && res.data?.user?.role === 'student',
        details: `JWT generated, User: ${res.data?.user?.name || 'Student'} (Role: ${res.data?.user?.role})`,
      }),
    },

    // 5. Student Gamification Status
    {
      name: 'Student Gamification Status',
      category: 'Database Query',
      role: 'Student',
      url: `${BASE_URL}/api/gamification/status`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
      validator: (res) => {
        const d = res.data;
        const valid = d?.success === true && typeof d.oxygen === 'number' && typeof d.pearls === 'number';
        return {
          passed: valid,
          details: `Oxygen: ${d?.oxygen}, Pearls: ${d?.pearls}, Streak: ${d?.status?.streakCount || 0}d, League: ${d?.status?.currentLeague}`,
        };
      },
    },

    // 6. Student Gamification Path (500+ Nodes)
    {
      name: 'Student Gamification Path (560 nodes)',
      category: 'Bulk DB Query',
      role: 'Student',
      url: `${BASE_URL}/api/gamification/path`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
      validator: (res) => {
        const nodes = res.data?.nodes;
        const valid = res.data?.success === true && Array.isArray(nodes) && nodes.length >= 500;
        return {
          passed: valid,
          details: `Fetched ${nodes?.length || 0} lesson nodes across units (expected >= 500)`,
        };
      },
    },

    // 7. Student Lesson 1693 Interactive Stages
    {
      name: 'Student Lesson 1693 Stages (word_match/listen_tap)',
      category: 'Complex DB Record',
      role: 'Student',
      url: `${BASE_URL}/api/gamification/lesson/1693`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
      validator: (res) => {
        const lesson = res.data?.lesson;
        const stages = lesson?.stages;
        if (!lesson || !Array.isArray(stages) || stages.length === 0) {
          return { passed: false, details: 'Missing lesson stages array' };
        }

        const wordMatch = stages.find((s) => s.type === 'word_match');
        const listenTap = stages.find((s) => s.type === 'listen_tap');

        const hasValidWordMatch = wordMatch && Array.isArray(wordMatch.pairs) && wordMatch.pairs.length >= 2 && wordMatch.pairs[0].target && wordMatch.pairs[0].native;
        const hasValidListenTap = listenTap && typeof listenTap.targetSentence === 'string' && Array.isArray(listenTap.tokens) && listenTap.tokens.length >= 2;

        const passed = Boolean(hasValidWordMatch && hasValidListenTap);
        return {
          passed,
          details: `Stages: ${stages.length} (${stages.map((s) => s.type).join(', ')}), Pairs: ${wordMatch?.pairs?.length || 0}, Tokens: ${listenTap?.tokens?.length || 0}`,
        };
      },
    },

    // 8. Student Leaderboard
    {
      name: 'Student Leaderboard Query',
      category: 'Aggregation Query',
      role: 'Student',
      url: `${BASE_URL}/api/gamification/leaderboard`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
      validator: (res) => {
        const list = res.data?.leaderboard;
        const valid = res.data?.success === true && Array.isArray(list) && list.length > 0;
        return {
          passed: valid,
          details: `League: "${res.data?.league}", Top rank: ${list?.[0]?.name} (${list?.[0]?.xp} XP)`,
        };
      },
    },

    // 9. Admin Gamification Path
    {
      name: 'Admin Gamification Path',
      category: 'Bulk DB Query',
      role: 'Admin',
      url: `${BASE_URL}/api/gamification/path`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
      validator: (res) => {
        const nodes = res.data?.nodes;
        const valid = res.data?.success === true && Array.isArray(nodes) && nodes.length >= 500;
        return {
          passed: valid,
          details: `Admin view: ${nodes?.length || 0} nodes retrieved`,
        };
      },
    },

    // 10. Admin Curriculum Units Summary
    {
      name: 'Admin Curriculum Units Summary',
      category: 'Database Query',
      role: 'Admin',
      url: `${BASE_URL}/api/curriculum/units`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
      validator: (res) => {
        const units = res.data?.units;
        const valid = res.data?.success === true && Array.isArray(units) && units.length >= 30;
        return {
          passed: valid,
          details: `Total Units: ${res.data?.totalUnits || units?.length}, Language: ${res.data?.learningLanguage || 'de'}`,
        };
      },
    },

    // 11. Admin Curriculum Lessons Outline
    {
      name: 'Admin Curriculum Lessons List',
      category: 'Database Query',
      role: 'Admin',
      url: `${BASE_URL}/api/curriculum/lessons?limit=10`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
      validator: (res) => {
        const lessons = res.data?.lessons;
        const valid = res.data?.success === true && Array.isArray(lessons) && lessons.length > 0;
        return {
          passed: valid,
          details: `Retrieved ${lessons?.length || 0} lessons (first: "${lessons?.[0]?.title?.substring(0, 30)}...")`,
        };
      },
    },

    // 12. Admin Live Status Toggle (Write Operation)
    {
      name: 'Admin Live Status Toggle (Patch)',
      category: 'DB Write / Update',
      role: 'Admin',
      url: `${BASE_URL}/api/curriculum/lessons/1693/live`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isLive: true },
      validator: (res) => {
        const valid = res.data?.success === true && res.data?.isLive === true;
        return {
          passed: valid,
          details: `Lesson 1693 live confirmed: ${res.data?.isLive ? '🟢 LIVE' : '🔒 DRAFT'}`,
        };
      },
    },
  ];

  // Phase 3: Execute Benchmark Runs
  console.log(`\n${COLORS.bold}🚀 Phase 2: Running Benchmarks (${ITERATIONS} iterations per endpoint)...${COLORS.reset}\n`);

  const results = [];
  for (const config of testMatrix) {
    process.stdout.write(`   Benchmarking: ${config.name.padEnd(50, ' ')} `);
    const result = await benchmarkEndpoint(config);
    results.push(result);
    const rating = getRating(result.avg);
    console.log(`${rating.color}${result.avg.toFixed(1).padStart(7, ' ')} ms ${rating.icon}${COLORS.reset}`);
  }

  // Phase 4: Output Scorecard
  console.log(`\n${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}                    HOSTINGER DATABASE & API PERFORMANCE SCORECARD${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);

  // Table Header
  console.log(
    `┌──────────────────────────────────────────────┬────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────┐`
  );
  console.log(
    `│ ${'Endpoint / Metric'.padEnd(44)} │ ${'Role'.padEnd(6)} │ ${'DNS'.padStart(8)} │ ${'SSL'.padStart(8)} │ ${'TTFB'.padStart(8)} │ ${'Min'.padStart(8)} │ ${'Max'.padStart(8)} │ ${'Avg'.padStart(8)} │ ${'Rating'.padEnd(9)} │`
  );
  console.log(
    `├──────────────────────────────────────────────┼────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────┤`
  );

  for (const r of results) {
    const rating = getRating(r.avg);
    const roleColor = r.role === 'Admin' ? COLORS.magenta : r.role === 'Student' ? COLORS.blue : COLORS.gray;
    const nameTrunc = r.name.length > 44 ? r.name.substring(0, 41) + '...' : r.name.padEnd(44);

    console.log(
      `│ ${nameTrunc} │ ${roleColor}${r.role.padEnd(6)}${COLORS.reset} │ ${(r.avgDns.toFixed(1) + 'ms').padStart(8)} │ ${(r.avgSsl.toFixed(1) + 'ms').padStart(8)} │ ${(r.avgTtfb.toFixed(1) + 'ms').padStart(8)} │ ${(r.min.toFixed(1) + 'ms').padStart(8)} │ ${(r.max.toFixed(1) + 'ms').padStart(8)} │ ${rating.color}${(r.avg.toFixed(1) + 'ms').padStart(8)}${COLORS.reset} │ ${rating.color}${rating.icon} ${rating.label.padEnd(7)}${COLORS.reset}│`
    );
  }

  console.log(
    `└──────────────────────────────────────────────┴────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────────┘`
  );

  // Phase 5: Integrity Verification Details
  console.log(`\n${COLORS.bold}🔍 Database & Response Integrity Verification:${COLORS.reset}`);
  for (const r of results) {
    const statusIcon = r.integrityPassed ? `${COLORS.green}✔ PASS${COLORS.reset}` : `${COLORS.red}✖ FAIL${COLORS.reset}`;
    console.log(`  ${statusIcon} [${r.role.padEnd(7)}] ${COLORS.bold}${r.name}${COLORS.reset}`);
    console.log(`         ${COLORS.gray}↳ ${r.integrityDetails}${COLORS.reset}`);
  }

  // Phase 6: Performance Statistics Breakdown
  const allAvgs = results.map((r) => r.avg);
  const overallAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;
  const studentEndpoints = results.filter((r) => r.role === 'Student');
  const adminEndpoints = results.filter((r) => r.role === 'Admin');
  const studentAvg = studentEndpoints.reduce((a, b) => a + b.avg, 0) / studentEndpoints.length;
  const adminAvg = adminEndpoints.reduce((a, b) => a + b.avg, 0) / adminEndpoints.length;

  const excellentCount = results.filter((r) => r.avg < 200).length;
  const goodCount = results.filter((r) => r.avg >= 200 && r.avg < 500).length;
  const fairCount = results.filter((r) => r.avg >= 500 && r.avg < 1000).length;
  const slowCount = results.filter((r) => r.avg >= 1000).length;

  const fastest = results.reduce((prev, curr) => (curr.avg < prev.avg ? curr : prev));
  const slowest = results.reduce((prev, curr) => (curr.avg > prev.avg ? curr : prev));

  console.log(`\n${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}                           SUMMARY PERFORMANCE ANALYTICS${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}`);
  console.log(`  • Overall Average Latency:      ${COLORS.bold}${overallAvg.toFixed(1)} ms${COLORS.reset}`);
  console.log(`  • Student Experience Average:   ${COLORS.blue}${studentAvg.toFixed(1)} ms${COLORS.reset}`);
  console.log(`  • Admin Management Average:     ${COLORS.magenta}${adminAvg.toFixed(1)} ms${COLORS.reset}`);
  console.log(`  • Fastest Live Endpoint:        ${COLORS.green}${fastest.name} (${fastest.avg.toFixed(1)} ms)${COLORS.reset}`);
  console.log(`  • Heaviest / Slowest Endpoint:  ${COLORS.yellow}${slowest.name} (${slowest.avg.toFixed(1)} ms)${COLORS.reset}`);
  console.log(`  • Ratings Distribution:         ⚡ Excellent (<200ms): ${excellentCount}  |  🟢 Good (<500ms): ${goodCount}  |  🟡 Fair (<1s): ${fairCount}  |  🔴 Slow (>=1s): ${slowCount}`);
  console.log(`  • Database Integrity Checks:    ${results.every((r) => r.integrityPassed) ? `${COLORS.green}100% PASSED (All models & stages verified)${COLORS.reset}` : `${COLORS.red}ISSUES DETECTED${COLORS.reset}`}`);
  console.log(`${COLORS.bold}${COLORS.cyan}========================================================================================${COLORS.reset}\n`);

  return {
    results,
    overallAvg,
    studentAvg,
    adminAvg,
    fastest,
    slowest,
  };
}

if (require.main === module) {
  runLiveBenchmark().catch((err) => {
    console.error('Fatal error during benchmark:', err);
    process.exit(1);
  });
}

module.exports = {
  runLiveBenchmark,
  measureRequest,
  benchmarkEndpoint,
  ADMIN_CREDENTIALS,
  STUDENT_CREDENTIALS,
  BASE_URL,
};
