const request = require('supertest');
const app = require('../server');

describe('Mobile Sound Effects Tester Isolated Route', () => {
    it('GET /check/sounds returns 200 with HTML content', async () => {
        const res = await request(app).get('/check/sounds');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
        expect(res.text).toContain('DolphinCoder LMS — Mobile Sound Effects Studio');
        expect(res.text).toContain('Warm Acoustic Marimba');
    });

    it('GET /check/sounds/ returns 200 with HTML content', async () => {
        const res = await request(app).get('/check/sounds/');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
        expect(res.text).toContain('DolphinCoder LMS — Mobile Sound Effects Studio');
    });
});
