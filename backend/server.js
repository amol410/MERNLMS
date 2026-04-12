const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const modules = [
    './config/database',
    './middleware/errorHandler',
    './routes/auth',
    './routes/notes',
    './routes/videos',
    './routes/quizzes',
    './routes/flashcards',
    './routes/admin'
];

modules.forEach(mod => {
    try {
        require(mod);
        console.error('OK: ' + mod);
    } catch(e) {
        console.error('FAIL: ' + mod + ' => ' + e.message);
    }
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is alive!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.error('Server started on port ' + PORT);
});

module.exports = app;