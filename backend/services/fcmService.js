/**
 * DolphinCoder LMS — Firebase Cloud Messaging (FCM) Push Notification Service
 * 
 * Provides unified unicast, multicast, and topic-based push notifications
 * with Android high-priority channels and automatic pruning of stale tokens.
 * Gracefully falls back if credentials are unconfigured without crashing.
 */

const admin = require('firebase-admin');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging: getAdminMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

let testMessagingMock = null;

function createCert(data) {
    if (typeof cert === 'function') return cert(data);
    if (typeof admin.cert === 'function') return admin.cert(data);
    if (admin.credential && typeof admin.credential.cert === 'function') return admin.credential.cert(data);
    throw new Error('No cert function found in firebase-admin');
}

function createApplicationDefault() {
    const { applicationDefault } = require('firebase-admin/app');
    if (typeof applicationDefault === 'function') return applicationDefault();
    if (typeof admin.applicationDefault === 'function') return admin.applicationDefault();
    if (admin.credential && typeof admin.credential.applicationDefault === 'function') return admin.credential.applicationDefault();
    throw new Error('No applicationDefault function found in firebase-admin');
}

/**
 * Resolves or initializes the Firebase Messaging instance safely.
 * Returns null if credentials are not configured or invalid.
 */
function getMessaging() {
    if (testMessagingMock) {
        return testMessagingMock;
    }

    if (process.env.NODE_ENV === 'test' && !process.env.TEST_REAL_FCM) {
        return null;
    }

    const apps = getApps();
    if (apps && apps.length > 0) {
        try {
            return getAdminMessaging(apps[0]);
        } catch (e) {
            console.warn('⚠️ [FCM] Could not get messaging instance from existing Firebase app:', e.message);
        }
    }

    try {
        let credential = null;
        const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (saEnv) {
            const trimmed = saEnv.trim();
            if (trimmed.startsWith('{')) {
                credential = createCert(JSON.parse(trimmed));
            } else {
                const candidatePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
                if (fs.existsSync(candidatePath)) {
                    credential = createCert(require(candidatePath));
                }
            }
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            credential = createCert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            credential = createApplicationDefault();
        } else {
            const defaultConfigPath = path.resolve(__dirname, '../config/serviceAccountKey.json');
            if (fs.existsSync(defaultConfigPath)) {
                credential = createCert(require(defaultConfigPath));
            }
        }

        if (!credential) {
            console.warn('⚠️ [FCM] Firebase service account credentials not configured. Push notifications disabled.');
            return null;
        }

        const app = initializeApp({ credential });
        return getAdminMessaging(app);
    } catch (err) {
        console.warn('⚠️ [FCM] Failed to initialize Firebase Admin:', err.message);
        return null;
    }
}

/**
 * Returns true if Firebase messaging is ready to deliver notifications.
 */
function isConfigured() {
    return getMessaging() !== null;
}

/**
 * Formats custom data payload so all values are strings (required by FCM specification).
 */
function formatDataPayload(data) {
    if (!data || typeof data !== 'object') return {};
    const formatted = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        formatted[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return formatted;
}

/**
 * Sends a unicast push notification to a specific user by their ID.
 * Auto-prunes stale tokens (e.g., registration-token-not-registered).
 *
 * @param {number|string|Object} userId - The user ID or User model instance
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Custom payload key-values
 * @returns {Promise<Object>} Delivery result { success: boolean, ... }
 */
async function sendToUser(userId, { title, body, data } = {}) {
    try {
        const messaging = getMessaging();
        if (!messaging) {
            return { success: false, reason: 'unconfigured' };
        }

        let user = null;
        if (typeof userId === 'object' && userId !== null && userId.id) {
            user = userId;
        } else {
            user = await User.findByPk(userId);
        }

        if (!user) {
            return { success: false, reason: 'user_not_found' };
        }

        if (!user.fcmToken) {
            return { success: false, reason: 'no_token' };
        }

        const message = {
            token: user.fcmToken,
            notification: {
                title: title || '',
                body: body || '',
            },
            data: formatDataPayload(data),
            android: {
                priority: 'high',
                notification: {
                    channelId: 'dolphincoder_high_importance',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        try {
            const messageId = await messaging.send(message);
            return { success: true, messageId };
        } catch (sendErr) {
            const errorCode = sendErr.code || '';
            const errorMsg = sendErr.message || '';
            const isStale = (
                errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token' ||
                errorMsg.includes('registration-token-not-registered') ||
                errorMsg.includes('invalid-registration-token')
            );

            if (isStale) {
                try {
                    user.fcmToken = null;
                    await user.save();
                    console.log(`🧹 [FCM] Stale token auto-pruned for user ${user.id}`);
                } catch (saveErr) {
                    console.warn(`⚠️ [FCM] Could not nullify stale token for user ${user.id}:`, saveErr.message);
                }
                return { success: false, reason: 'stale_token_pruned', error: errorCode || errorMsg, pruned: true };
            }

            console.error(`⚠️ [FCM] Error sending to user ${user.id}:`, errorMsg);
            return { success: false, error: errorCode || errorMsg };
        }
    } catch (outerErr) {
        console.error('⚠️ [FCM] Unhandled error in sendToUser:', outerErr.message);
        return { success: false, error: outerErr.message };
    }
}

/**
 * Sends multicast push notifications to multiple device tokens simultaneously.
 * Automatically identifies and prunes invalid or unregistered tokens.
 *
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Custom payload key-values
 * @returns {Promise<Object>} Batch delivery summary
 */
async function sendMulticast(tokens, { title, body, data } = {}) {
    try {
        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return { success: false, reason: 'no_tokens' };
        }

        const validTokens = tokens.filter(t => typeof t === 'string' && t.trim().length > 0);
        if (validTokens.length === 0) {
            return { success: false, reason: 'no_tokens' };
        }

        const messaging = getMessaging();
        if (!messaging) {
            return { success: false, reason: 'unconfigured' };
        }

        const multicastMessage = {
            tokens: validTokens,
            notification: {
                title: title || '',
                body: body || '',
            },
            data: formatDataPayload(data),
            android: {
                priority: 'high',
                notification: {
                    channelId: 'dolphincoder_high_importance',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const sendFn = messaging.sendEachForMulticast
            ? messaging.sendEachForMulticast.bind(messaging)
            : (messaging.sendMulticast ? messaging.sendMulticast.bind(messaging) : null);

        if (!sendFn) {
            return { success: false, error: 'Multicast messaging method unavailable' };
        }

        const response = await sendFn(multicastMessage);

        const staleTokens = [];
        if (response.responses && Array.isArray(response.responses)) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error) {
                    const code = resp.error.code || '';
                    const msg = resp.error.message || '';
                    if (
                        code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-registration-token' ||
                        msg.includes('registration-token-not-registered') ||
                        msg.includes('invalid-registration-token')
                    ) {
                        staleTokens.push(validTokens[idx]);
                    }
                }
            });
        }

        if (staleTokens.length > 0) {
            try {
                await User.update({ fcmToken: null }, { where: { fcmToken: staleTokens } });
                console.log(`🧹 [FCM] Pruned ${staleTokens.length} stale tokens from database.`);
            } catch (pruneErr) {
                console.warn('⚠️ [FCM] Failed to batch prune stale tokens:', pruneErr.message);
            }
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
            staleTokensPruned: staleTokens.length,
        };
    } catch (err) {
        console.error('⚠️ [FCM] Error in sendMulticast:', err.message);
        return { success: false, error: err.code || err.message };
    }
}

/**
 * Sends a push notification to all subscribers of a specific topic.
 *
 * @param {string} topic - Topic name (e.g., 'announcements', 'german_learners')
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Custom payload key-values
 * @returns {Promise<Object>} Delivery result
 */
async function sendToTopic(topic, { title, body, data } = {}) {
    try {
        if (!topic || typeof topic !== 'string') {
            return { success: false, reason: 'no_topic' };
        }

        const messaging = getMessaging();
        if (!messaging) {
            return { success: false, reason: 'unconfigured' };
        }

        const message = {
            topic: topic.replace(/^\/topics\//, ''),
            notification: {
                title: title || '',
                body: body || '',
            },
            data: formatDataPayload(data),
            android: {
                priority: 'high',
                notification: {
                    channelId: 'dolphincoder_high_importance',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const messageId = await messaging.send(message);
        return { success: true, messageId };
    } catch (err) {
        console.error(`⚠️ [FCM] Error in sendToTopic (${topic}):`, err.message);
        return { success: false, error: err.code || err.message };
    }
}

/**
 * Testing helpers to inject or reset mocks without touching production credentials.
 */
function _setMessagingInstanceForTesting(mock) {
    testMessagingMock = mock;
}

function _resetForTesting() {
    testMessagingMock = null;
}

module.exports = {
    getMessaging,
    isConfigured,
    sendToUser,
    sendMulticast,
    sendToTopic,
    _setMessagingInstanceForTesting,
    _resetForTesting,
};
