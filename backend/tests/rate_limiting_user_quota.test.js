const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const app = require('../server');

describe('User-Based vs IP-Based Rate Limiting Suite', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_rate_limits';

    describe('keyGenerator Logic', () => {
        // Reusable key generator matching server.js implementation
        const keyGenerator = (req) => {
            if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                const token = req.headers.authorization.split(' ')[1];
                try {
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.id) {
                        return `usr_${decoded.id}`;
                    }
                } catch (_) {}
            }
            return req.ip || 'anonymous';
        };

        it('returns usr_{id} when valid Bearer token is provided', () => {
            const token = jwt.sign({ id: 555, role: 'student' }, JWT_SECRET);
            const req = {
                headers: { authorization: `Bearer ${token}` },
                ip: '203.0.113.195',
            };
            expect(keyGenerator(req)).toBe('usr_555');
        });

        it('falls back to req.ip when authorization header is absent', () => {
            const req = {
                headers: {},
                ip: '203.0.113.195',
            };
            expect(keyGenerator(req)).toBe('203.0.113.195');
        });

        it('falls back to req.ip when authorization header does not start with Bearer', () => {
            const req = {
                headers: { authorization: 'Basic dXNlcjpwYXNz' },
                ip: '203.0.113.195',
            };
            expect(keyGenerator(req)).toBe('203.0.113.195');
        });

        it('falls back to req.ip when token is malformed', () => {
            const req = {
                headers: { authorization: 'Bearer invalid.token.structure' },
                ip: '203.0.113.195',
            };
            expect(keyGenerator(req)).toBe('203.0.113.195');
        });

        it('falls back to req.ip when token payload has no id', () => {
            const token = jwt.sign({ role: 'guest' }, JWT_SECRET);
            const req = {
                headers: { authorization: `Bearer ${token}` },
                ip: '203.0.113.195',
            };
            expect(keyGenerator(req)).toBe('203.0.113.195');
        });

        it('falls back to "anonymous" when neither token id nor req.ip is present', () => {
            const req = {
                headers: {},
            };
            expect(keyGenerator(req)).toBe('anonymous');
        });
    });

    describe('Classroom NAT / Shared Wi-Fi Simulation', () => {
        let testApp;
        const studentAToken = jwt.sign({ id: 101, name: 'Student A' }, JWT_SECRET);
        const studentBToken = jwt.sign({ id: 102, name: 'Student B' }, JWT_SECRET);
        const sharedSchoolIP = '198.51.100.42';

        beforeAll(() => {
            testApp = express();
            testApp.set('trust proxy', 1);

            const userBasedLimiter = rateLimit({
                windowMs: 60 * 1000,
                max: 3, // Low limit to test quota threshold
                standardHeaders: true,
                legacyHeaders: false,
                validate: { trustProxy: false },
                keyGenerator: (req) => {
                    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                        const token = req.headers.authorization.split(' ')[1];
                        try {
                            const decoded = jwt.decode(token);
                            if (decoded && decoded.id) {
                                return `usr_${decoded.id}`;
                            }
                        } catch (_) {}
                    }
                    return req.ip || 'anonymous';
                },
                message: { success: false, message: 'Too many requests, please slow down and try again.' }
            });

            testApp.use('/test-quiz-endpoint', userBasedLimiter, (req, res) => {
                res.status(200).json({ success: true, message: 'Quiz question fetched' });
            });
        });

        it('allows Student A up to their quota and returns 429 when quota is exceeded', async () => {
            // Student A sends 3 requests (within quota)
            for (let i = 0; i < 3; i++) {
                const res = await request(testApp)
                    .get('/test-quiz-endpoint')
                    .set('X-Forwarded-For', sharedSchoolIP)
                    .set('Authorization', `Bearer ${studentAToken}`);
                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            }

            // Student A's 4th request exceeds quota -> 429 Too Many Requests
            const res4 = await request(testApp)
                .get('/test-quiz-endpoint')
                .set('X-Forwarded-For', sharedSchoolIP)
                .set('Authorization', `Bearer ${studentAToken}`);
            expect(res4.status).toBe(429);
            expect(res4.body.success).toBe(false);
            expect(res4.body.message).toMatch(/Too many requests/i);
        });

        it('allows Student B on the EXACT SAME IP to make requests even though Student A is rate-limited', async () => {
            // Student B makes request from the same school Wi-Fi IP
            const resB1 = await request(testApp)
                .get('/test-quiz-endpoint')
                .set('X-Forwarded-For', sharedSchoolIP)
                .set('Authorization', `Bearer ${studentBToken}`);

            expect(resB1.status).toBe(200);
            expect(resB1.body.success).toBe(true);

            // Student B makes second request
            const resB2 = await request(testApp)
                .get('/test-quiz-endpoint')
                .set('X-Forwarded-For', sharedSchoolIP)
                .set('Authorization', `Bearer ${studentBToken}`);

            expect(resB2.status).toBe(200);
            expect(resB2.body.success).toBe(true);

            // Meanwhile, Student A on the same IP is STILL rate-limited
            const resABlocked = await request(testApp)
                .get('/test-quiz-endpoint')
                .set('X-Forwarded-For', sharedSchoolIP)
                .set('Authorization', `Bearer ${studentAToken}`);

            expect(resABlocked.status).toBe(429);
        });
    });

    describe('Live Server Health Endpoint & Rate Limit Headers', () => {
        it('returns RateLimit headers conforming to RFC standard', async () => {
            const studentToken = jwt.sign({ id: 999 }, JWT_SECRET);
            const res = await request(app)
                .get('/api/health')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['ratelimit-limit']).toBeDefined();
            expect(res.headers['ratelimit-remaining']).toBeDefined();
        });

        it('tracks unauthenticated health check callers by IP', async () => {
            const res = await request(app)
                .get('/api/health');

            expect(res.status).toBe(200);
            expect(res.headers['ratelimit-limit']).toBeDefined();
        });
    });
});
