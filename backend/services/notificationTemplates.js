/**
 * DolphinCoder LMS — Push Notification Template Engine & Repository
 * 
 * Provides automated push notification templates (streak reminders, oxygen refills,
 * and league alerts) with file-backed persistence and safe default fallbacks.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_TEMPLATES = {
    streak_reminder: {
        title: '🔥 Keep your streak alive!',
        body: "Dolphy misses you! Complete today's lesson to maintain your streak.",
        route: '/home',
        enabled: true,
        time: '20:00',
    },
    oxygen_full: {
        title: '🫧 Full Oxygen Restored!',
        body: 'Your oxygen bubbles are full (5/5). Dive back into the archipelago!',
        route: '/home',
        enabled: true,
    },
    league_alert: {
        title: '🏆 League Alert!',
        body: 'Someone just climbed the leaderboard. Check your league standing!',
        route: '/leagues',
        enabled: true,
    },
    inactivity_alert: {
        title: '🌊 The ocean awaits!',
        body: 'Dolphy misses you! Jump back into your lessons to continue your learning journey.',
        route: '/home',
        enabled: true,
    },
};

let customStoragePath = null;

/**
 * Returns the resolved storage path for notification templates.
 */
function getStoragePath() {
    if (customStoragePath) {
        return customStoragePath;
    }
    if (process.env.NOTIFICATION_TEMPLATES_PATH) {
        return process.env.NOTIFICATION_TEMPLATES_PATH;
    }
    return path.join(__dirname, '../config/notificationTemplates.json');
}

/**
 * Returns an unlinked deep clone of the default notification templates.
 */
function getDefaultTemplates() {
    return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
}

/**
 * Reads persisted templates from disk or returns safe defaults if missing/corrupt.
 * Automatically deep-merges with default templates to ensure newly introduced keys are never undefined.
 *
 * @returns {Object} Key-value map of notification templates
 */
function getTemplates() {
    const filePath = getStoragePath();
    try {
        if (!fs.existsSync(filePath)) {
            return getDefaultTemplates();
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return getDefaultTemplates();
        }

        // Deep merge with defaults so that partial overrides retain missing properties
        const merged = getDefaultTemplates();
        for (const [key, val] of Object.entries(parsed)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                merged[key] = { ...(merged[key] || {}), ...val };
            }
        }

        return merged;
    } catch (err) {
        console.warn('⚠️ [NotificationTemplates] Failed to read templates, falling back to defaults:', err.message);
        return getDefaultTemplates();
    }
}

/**
 * Validates and saves updated notification templates to disk.
 *
 * @param {Object} newTemplates - The updated templates object
 * @returns {Object} The saved and merged templates
 */
function saveTemplates(newTemplates) {
    if (!newTemplates || typeof newTemplates !== 'object' || Array.isArray(newTemplates)) {
        throw new Error('Invalid template data: expected an object of templates');
    }

    const current = getTemplates();
    const updated = { ...current };

    for (const [key, val] of Object.entries(newTemplates)) {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            updated[key] = {
                ...(updated[key] || {}),
                ...val,
            };
        }
    }

    const filePath = getStoragePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
}

/**
 * Resets the persisted template configuration back to system defaults.
 *
 * @returns {Object} Default notification templates
 */
function resetToDefaults() {
    const filePath = getStoragePath();
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.warn('⚠️ [NotificationTemplates] Error clearing persisted templates:', err.message);
    }
    return getDefaultTemplates();
}

/**
 * Test helper: Overrides the storage path (e.g. for temporary test files).
 */
function _setStoragePathForTesting(p) {
    customStoragePath = p;
}

/**
 * Test helper: Resets storage path back to normal configuration.
 */
function _resetStoragePathForTesting() {
    customStoragePath = null;
}

module.exports = {
    DEFAULT_TEMPLATES,
    getDefaultTemplates,
    getTemplates,
    saveTemplates,
    resetToDefaults,
    getStoragePath,
    _setStoragePathForTesting,
    _resetStoragePathForTesting,
};
