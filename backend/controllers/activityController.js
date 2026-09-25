const { Op } = require('sequelize');
const UserActivity = require('../models/UserActivity');
const { getClientDate, toClientLocalDate, getClientDayUtcBounds } = require('../utils/dateHelper');

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
 * GET /api/activity/summary
 * Query params:
 *   date        — single day (YYYY-MM-DD), defaults to client's local today
 *   weekOf      — returns full week containing this date (YYYY-MM-DD)
 *   countsOnly  — returns lightweight summary counts only (for dashboard)
 */
exports.getSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let where = { userId };
        let responseDate = null;
        let weekRange = null;

        if (req.query.weekOf) {
            const { start, end } = getWeekBounds(new Date(req.query.weekOf));
            // Broaden range by 1 day on each side so activities crossing UTC/local midnight are retrieved
            const prevDay = new Date(new Date(start).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const nextDay = new Date(new Date(end).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            where[Op.or] = [
                { activityDate: { [Op.between]: [prevDay, nextDay] } },
                { createdAt: { [Op.between]: [new Date(start + 'T00:00:00Z'), new Date(nextDay + 'T23:59:59Z')] } },
            ];
            weekRange = { start, end };
        } else {
            const date = req.query.date || getClientDate(req);
            responseDate = date;
            const { startUtc, endUtc } = getClientDayUtcBounds(date, req);

            // Match either stored activityDate or actual createdAt in client's local day
            where[Op.or] = [
                { activityDate: date },
                { createdAt: { [Op.between]: [startUtc, endUtc] } },
            ];
        }

        // Fast counts-only aggregation for Dashboard (skips heavy row fetching and metadata decoding)
        if (req.query.countsOnly === 'true') {
            const rows = await UserActivity.findAll({
                attributes: ['id', 'activityType', 'activityDate', 'createdAt'],
                where,
                raw: true,
            });

            let quizCount = 0;
            let noteCount = 0;
            let flashcardCount = 0;

            for (const item of rows) {
                // Confirm the activity belongs to responseDate in user's timezone
                const localDate = toClientLocalDate(item.createdAt, req) || item.activityDate;
                if (localDate === responseDate) {
                    if (item.activityType === 'quiz') quizCount++;
                    else if (item.activityType === 'note') noteCount++;
                    else if (item.activityType === 'flashcard') flashcardCount++;
                }
            }

            return res.json({
                success: true,
                type: 'counts',
                date: responseDate,
                summary: {
                    quizCount,
                    noteCount,
                    flashcardCount,
                    total: quizCount + noteCount + flashcardCount,
                },
            });
        }

        const rows = await UserActivity.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });

        if (weekRange) {
            // Group by client local date then by type for weekly view
            const byDate = {};
            let totalInWeek = 0;

            for (const row of rows) {
                const d = toClientLocalDate(row.createdAt, req) || row.activityDate;
                // Only place in day if it falls within the requested week
                if (d >= weekRange.start && d <= weekRange.end) {
                    totalInWeek++;
                    if (!byDate[d]) byDate[d] = { quizzes: [], notes: [], flashcards: [] };
                    const key = row.activityType === 'quiz' ? 'quizzes'
                        : row.activityType === 'note' ? 'notes' : 'flashcards';
                    byDate[d][key].push(formatActivity(row, d));
                }
            }

            return res.json({
                success: true,
                type: 'week',
                weekRange,
                days: byDate,
                total: totalInWeek,
            });
        }

        // Single-day response: group and return formatted items
        const quizzes = [];
        const notes = [];
        const flashcards = [];

        for (const row of rows) {
            const d = toClientLocalDate(row.createdAt, req) || row.activityDate;
            if (d === responseDate) {
                const formatted = formatActivity(row, d);
                if (row.activityType === 'quiz') quizzes.push(formatted);
                else if (row.activityType === 'note') notes.push(formatted);
                else if (row.activityType === 'flashcard') flashcards.push(formatted);
            }
        }

        res.json({
            success: true,
            type: 'day',
            date: responseDate,
            activities: { quizzes, notes, flashcards },
            summary: {
                quizCount: quizzes.length,
                noteCount: notes.length,
                flashcardCount: flashcards.length,
                total: quizzes.length + notes.length + flashcards.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

function formatActivity(row, effectiveDate = null) {
    return {
        id: row.id,
        activityType: row.activityType,
        resourceId: row.resourceId,
        resourceTitle: row.resourceTitle,
        subjectName: row.subjectName,
        topicName: row.topicName,
        metadata: row.metadata,
        activityDate: effectiveDate || row.activityDate,
        createdAt: row.createdAt,
    };
}
