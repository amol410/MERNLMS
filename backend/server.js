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

// Connect to MySQL
connectDB();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth requests, please try again later.' },
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'DolphinCoder LMS API is running', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/admin', require('./routes/admin'));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
} else {
    app.use(notFound);
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`DolphinCoder LMS API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;