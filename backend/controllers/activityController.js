const { Op } = require('sequelize');
const UserActivity = require('../models/UserActivity');

/**
 * Helper: get the Monday (start) and Sunday (end) of the ISO week
 * containing the given Date object. Returns DATEONLY strings.
 */
function getWeekBounds(dateInput) {
    let d;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split('-').map(Number);
        d = new Date(Date.UTC(y, m - 1, day));
    } else {
        d = new Date(dateInput);
    }
    const day = (d.getUTCDay() + 6) % 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - day);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const fmt = (dt) => dt.toISOString().split('T')[0];
    return { start: fmt(monday), end: fmt(sunday) };
}

/**
 * Helper: format DATEONLY string for today (local/UTC date)
 */
function getTodayDate() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

/**
 * Helper: format DATEONLY string for yesterday
 */
function getYesterdayDate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

/**
 * GET /api/activity/summary
 * Query params:
 *   date    — single day (YYYY-MM-DD), defaults to today
 *   weekOf  — returns full week containing this date (YYYY-MM-DD)
 */
exports.getSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let where = { userId };
        let responseDate = null;
        let weekRange = null;

        if (req.query.weekOf) {
            const { start, end } = getWeekBounds(new Date(req.query.weekOf));
            where.activityDate = { [Op.between]: [start, end] };
            weekRange = { start, end };
        } else {
            const date = req.query.date || getTodayDate();
            where.activityDate = date;
            responseDate = date;
        }

        const rows = await UserActivity.findAll({
            where,
            order: [['activityDate', 'DESC'], ['createdAt', 'DESC']],
        });

        if (weekRange) {
            // Group by date then by type for weekly view
            const byDate = {};
            for (const row of rows) {
                const d = row.activityDate;
                if (!byDate[d]) byDate[d] = { quizzes: [], notes: [], flashcards: [] };
                const key = row.activityType === 'quiz' ? 'quizzes'
                    : row.activityType === 'note' ? 'notes' : 'flashcards';
                byDate[d][key].push(formatActivity(row));
            }
            return res.json({
                success: true,
                type: 'week',
                weekRange,
                days: byDate,
                total: rows.length,
            });
        }

        // Single-day response
        const quizzes = rows.filter(r => r.activityType === 'quiz').map(formatActivity);
        const notes = rows.filter(r => r.activityType === 'note').map(formatActivity);
        const flashcards = rows.filter(r => r.activityType === 'flashcard').map(formatActivity);

        res.json({
            success: true,
            type: 'day',
            date: responseDate,
            activities: { quizzes, notes, flashcards },
            summary: {
                quizCount: quizzes.length,
                noteCount: notes.length,
                flashcardCount: flashcards.length,
                total: rows.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

function formatActivity(row) {
    return {
        id: row.id,
        activityType: row.activityType,
        resourceId: row.resourceId,
        resourceTitle: row.resourceTitle,
        subjectName: row.subjectName,
        topicName: row.topicName,
        metadata: row.metadata,
        activityDate: row.activityDate,
        createdAt: row.createdAt,
    };
}
