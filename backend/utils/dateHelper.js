/**
 * Helper to determine calendar dates in the client's local timezone.
 * Handles timezones (like Asia/Kolkata / IST: UTC+5:30) so that:
 * 1. New activities are tagged with the client's current local date.
 * 2. Historical timestamps (createdAt) are converted to their actual local calendar date.
 */

/**
 * Returns today's local date (YYYY-MM-DD) for the client.
 */
function getClientDate(req) {
    if (req) {
        // Explicit client date header from axios interceptor (e.g. '2026-09-25')
        const explicitDate = req.headers?.['x-client-date']
            || req.body?.clientDate
            || req.body?.activityDate
            || req.query?.clientDate;

        if (explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(String(explicitDate))) {
            return String(explicitDate);
        }
    }
    return toClientLocalDate(new Date(), req);
}

/**
 * Converts ANY given timestamp/date (e.g. row.createdAt) into the client's local calendar date (YYYY-MM-DD).
 * NOTE: Never uses req.headers['x-client-date'] here because dateInput may be a past date (e.g. Wednesday).
 */
function toClientLocalDate(dateInput, req) {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;

    // 1. Client timezone offset in minutes (e.g. -330 for IST)
    const tzOffset = req?.headers?.['x-timezone-offset'];
    if (tzOffset !== undefined && tzOffset !== null && !isNaN(Number(tzOffset))) {
        const offsetMin = Number(tzOffset);
        const clientTime = new Date(d.getTime() - offsetMin * 60 * 1000);
        return clientTime.toISOString().split('T')[0];
    }

    // 2. Client timezone string (e.g. 'Asia/Kolkata')
    const tz = req?.headers?.['x-client-timezone'];
    if (tz) {
        try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
        } catch (e) {
            // ignore invalid tz
        }
    }

    // 3. Default fallback: Asia/Kolkata (IST: UTC+5:30)
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    } catch (e) {
        return d.toISOString().split('T')[0];
    }
}

/**
 * Returns UTC [startUtc, endUtc] Date objects corresponding to the client's local day (00:00:00 to 23:59:59.999).
 */
function getClientDayUtcBounds(targetDateStr, req) {
    const tzOffset = req?.headers?.['x-timezone-offset'];
    let offsetMinutes = -330; // default IST (-330 minutes)
    if (tzOffset !== undefined && tzOffset !== null && !isNaN(Number(tzOffset))) {
        offsetMinutes = Number(tzOffset);
    }

    const [y, m, d] = targetDateStr.split('-').map(Number);
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
