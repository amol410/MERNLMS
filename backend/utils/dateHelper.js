/**
 * Helper to determine the client's local date (YYYY-MM-DD).
 * Accounts for timezones so that activities completed past midnight (e.g., 2:00 AM IST)
 * are recorded for the correct calendar date (e.g., Sept 25th) rather than UTC (Sept 24th).
 */

function getClientDate(req, dateObj = new Date()) {
    if (req) {
        // 1. Explicit client date header (e.g. '2026-09-25')
        const explicitDate = req.headers?.['x-client-date']
            || req.body?.clientDate
            || req.body?.activityDate
            || req.query?.clientDate;

        if (explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(String(explicitDate))) {
            return String(explicitDate);
        }

        // 2. Client timezone offset in minutes (e.g. -330 for IST)
        const tzOffset = req.headers?.['x-timezone-offset'];
        if (tzOffset !== undefined && tzOffset !== null && !isNaN(Number(tzOffset))) {
            const offsetMin = Number(tzOffset);
            const clientTime = new Date(dateObj.getTime() - offsetMin * 60 * 1000);
            return clientTime.toISOString().split('T')[0];
        }

        // 3. Client timezone string (e.g. 'Asia/Kolkata')
        const tz = req.headers?.['x-client-timezone'];
        if (tz) {
            try {
                return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dateObj);
            } catch (e) {
                // ignore invalid tz
            }
        }
    }

    // 4. Default timezone fallback: Asia/Kolkata (IST: UTC+5:30)
    // Ensures LMS operations in India default to IST rather than UTC
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(dateObj);
    } catch (e) {
        return dateObj.toISOString().split('T')[0];
    }
}

/**
 * Converts a UTC timestamp/date into the client's local date string (YYYY-MM-DD).
 */
function toClientLocalDate(dateInput, req) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return getClientDate(req, d);
}

/**
 * Returns UTC [start, end] Date objects corresponding to the client's local day (00:00:00 to 23:59:59.999).
 */
function getClientDayUtcBounds(targetDateStr, req) {
    // If client timezone offset is given
    const tzOffset = req?.headers?.['x-timezone-offset'];
    let offsetMinutes = -330; // default IST (-330 minutes)
    if (tzOffset !== undefined && tzOffset !== null && !isNaN(Number(tzOffset))) {
        offsetMinutes = Number(tzOffset);
    }

    // Construct local start of day (00:00:00) and end of day (23:59:59.999)
    const [y, m, d] = targetDateStr.split('-').map(Number);
    // UTC time of local midnight = UTC midnight + offsetMinutes * 60 * 1000
    const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) + (offsetMinutes * 60 * 1000);
    const endUtcMs = startUtcMs + (24 * 60 * 60 * 1000) - 1;

    return {
        startUtc: new Date(startUtcMs),
        endUtc: new Date(endUtcMs)
    };
}

module.exports = {
    getClientDate,
    toClientLocalDate,
    getClientDayUtcBounds,
};
