const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

require('./models/associations'); // must be before connectDB so all models are registered before sync
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 400, message: { success: false, message: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, message: 'Too many auth requests, please try again later.' } });

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') { app.use(morgan('dev')); }

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'DolphinCoder LMS API is running', version: '1.0.0' });
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/notifications', require('./routes/notification'));

const fs = require('fs');
const audioUploadDir = path.join(__dirname, 'uploads/audio');
if (!fs.existsSync(audioUploadDir)) {
    fs.mkdirSync(audioUploadDir, { recursive: true });
}
const pagesUploadDir = path.join(__dirname, 'uploads/pages');
if (!fs.existsSync(pagesUploadDir)) {
    fs.mkdirSync(pagesUploadDir, { recursive: true });
}
const curriculumUploadDir = path.join(__dirname, 'uploads/curriculum');
if (!fs.existsSync(curriculumUploadDir)) {
    fs.mkdirSync(curriculumUploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const {
    INDEXNOW_KEY,
    getSiteUrl,
    injectSeoTags,
    generateSitemap,
    generateRobotsTxt,
} = require('./utils/seoHelper');
const Page = require('./models/Page');
const User = require('./models/User');

// 1. Dynamic XML Sitemap for Google, Bing & AI Bots
app.get('/sitemap.xml', async (req, res) => {
    const siteUrl = getSiteUrl();
    try {
        let pages = [];
        try {
            pages = await Page.findAll({
                where: { status: 'published' },
                attributes: ['slug', 'updatedAt', 'createdAt'],
                order: [['updatedAt', 'DESC']],
            });
        } catch (dbErr) {
            console.warn('Page table not initialized yet, attempting sync...', dbErr.message);
            try {
                await Page.sync({ alter: true });
                pages = await Page.findAll({
                    where: { status: 'published' },
                    attributes: ['slug', 'updatedAt', 'createdAt'],
                    order: [['updatedAt', 'DESC']],
                });
            } catch (syncErr) {
                console.error('Page sync fallback notice:', syncErr.message);
            }
        }
        const sitemapXml = generateSitemap(pages || [], siteUrl);
        res.header('Content-Type', 'application/xml');
        res.status(200).send(sitemapXml);
    } catch (err) {
        // Safe fallback: always deliver a valid sitemap to Google and search engines
        const fallbackXml = generateSitemap([], siteUrl);
        res.header('Content-Type', 'application/xml');
        res.status(200).send(fallbackXml);
    }
});

// 2. AI & Search Engine robots.txt
app.get('/robots.txt', (req, res) => {
    const siteUrl = getSiteUrl();
    res.header('Content-Type', 'text/plain');
    res.send(generateRobotsTxt(siteUrl));
});

// 3. IndexNow Key verification endpoint for instant crawling verification
app.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(INDEXNOW_KEY);
});

// 4. Google AdMob app-ads.txt verification endpoint
app.get('/app-ads.txt', (req, res) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send('google.com, pub-6038618318911032, DIRECT, f08c47fec0942fa0\n');
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    const indexPath = path.resolve(__dirname, 'dist', 'index.html');

    app.get('*', async (req, res) => {
        const reqPath = req.path.replace(/^\/+|\/+$/g, '');

        // If this is a dynamic single-level path (e.g. /my-blog-post)
        if (
            reqPath &&
            !reqPath.includes('.') &&
            !reqPath.startsWith('api/') &&
            !reqPath.startsWith('uploads/')
        ) {
            try {
                const page = await Page.findOne({
                    where: { slug: reqPath, status: 'published' },
                    include: [{ model: User, as: 'author', attributes: ['name'] }],
                });

                if (page && fs.existsSync(indexPath)) {
                    const htmlTemplate = fs.readFileSync(indexPath, 'utf8');
                    const siteUrl = getSiteUrl();
                    const seoHtml = injectSeoTags(htmlTemplate, page, siteUrl);
                    return res.send(seoHtml);
                }
            } catch (err) {
                console.error('Error injecting dynamic SEO tags:', err.message);
            }
        }

        res.sendFile(indexPath);
    });
} else {
    app.use(notFound);
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.error(`Server running on port ${PORT}`);
    });
}

module.exports = app;