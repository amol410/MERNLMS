const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const fcmService = require('../services/fcmService');
const notificationTemplates = require('../services/notificationTemplates');
const { createTestUser, createTestAdmin } = require('./setup');

describe('FCM Push Notification API & Service Test Suite', () => {
    const testTemplatesPath = path.join(__dirname, 'temp_notification_templates.json');

    beforeEach(() => {
        notificationTemplates._setStoragePathForTesting(testTemplatesPath);
    });

    afterEach(() => {
        fcmService._resetForTesting();
        try {
            if (fs.existsSync(testTemplatesPath)) {
                fs.unlinkSync(testTemplatesPath);
            }
        } catch (_) {}
        notificationTemplates._resetStoragePathForTesting();
    });

    describe('POST /api/notifications/register-token', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/notifications/register-token')
                .send({ fcmToken: 'sample_token_123' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects missing or blank fcmToken with 400', async () => {
            const { token } = await createTestUser();

            const resEmpty = await request(app)
                .post('/api/notifications/register-token')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(resEmpty.status).toBe(400);
            expect(resEmpty.body.success).toBe(false);
            expect(resEmpty.body.message).toMatch(/required/i);

            const resBlank = await request(app)
                .post('/api/notifications/register-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ fcmToken: '   ' });

            expect(resBlank.status).toBe(400);
            expect(resBlank.body.success).toBe(false);
        });

        it('rejects fcmToken exceeding 500 characters with 400', async () => {
            const { token } = await createTestUser();
            const longToken = 'a'.repeat(501);

            const res = await request(app)
                .post('/api/notifications/register-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ fcmToken: longToken });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/maximum allowed length/i);
        });

        it('registers and persists valid fcmToken for authenticated user', async () => {
            const { user, token } = await createTestUser();
            const validToken = 'eXamPLe_FcM_TokEn_abc123_xyz789';

            const res = await request(app)
                .post('/api/notifications/register-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ fcmToken: validToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('FCM token registered successfully');

            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.fcmToken).toBe(validToken);
        });
    });

    describe('POST /api/notifications/unregister-token', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/notifications/unregister-token')
                .send();

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('clears fcmToken for authenticated user', async () => {
            const { user, token } = await createTestUser({
                fcmToken: 'token_to_be_cleared_12345',
            });

            const res = await request(app)
                .post('/api/notifications/unregister-token')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('FCM token unregistered successfully');

            const refreshedUser = await User.findByPk(user.id);
            expect(refreshedUser.fcmToken).toBeNull();
        });
    });

    describe('POST /api/notifications/send-test', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/notifications/send-test')
                .send();

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('returns unconfigured status when Firebase credentials are not provided', async () => {
            const { token } = await createTestUser({
                fcmToken: 'device_token_xyz',
            });

            const res = await request(app)
                .post('/api/notifications/send-test')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.reason).toBe('unconfigured');
        });

        it('returns no_token when user has not registered an FCM token', async () => {
            const mockMessaging = {
                send: jest.fn().mockResolvedValue('projects/test/messages/msg_123'),
            };
            fcmService._setMessagingInstanceForTesting(mockMessaging);

            const { token } = await createTestUser({ fcmToken: null });

            const res = await request(app)
                .post('/api/notifications/send-test')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.reason).toBe('no_token');
            expect(mockMessaging.send).not.toHaveBeenCalled();
        });

        it('successfully dispatches test notification with high importance Android channel', async () => {
            let capturedMessage = null;
            const mockMessaging = {
                send: jest.fn().mockImplementation(async (msg) => {
                    capturedMessage = msg;
                    return 'projects/test/messages/msg_test_success_999';
                }),
            };
            fcmService._setMessagingInstanceForTesting(mockMessaging);

            const { token } = await createTestUser({
                fcmToken: 'valid_test_fcm_token_123',
            });

            const res = await request(app)
                .post('/api/notifications/send-test')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.messageId).toBe('projects/test/messages/msg_test_success_999');

            expect(capturedMessage).toBeDefined();
            expect(capturedMessage.token).toBe('valid_test_fcm_token_123');
            expect(capturedMessage.notification.title).toBe('🔔 DolphinCoder Test');
            expect(capturedMessage.notification.body).toBe('Push notifications are working perfectly!');
            expect(capturedMessage.data.route).toBe('/home');
            expect(capturedMessage.android.priority).toBe('high');
            expect(capturedMessage.android.notification.channelId).toBe('dolphincoder_high_importance');
        });
    });

    describe('GET /api/notifications/stats', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .get('/api/notifications/stats');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects student requests with 403 forbidden', async () => {
            const { token } = await createTestUser({ role: 'student' });

            const res = await request(app)
                .get('/api/notifications/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized/i);
        });

        it('returns notification diagnostic metrics for admin user', async () => {
            const { token: adminToken } = await createTestAdmin();
            await createTestUser({ fcmToken: 'stats_token_alpha' });
            await createTestUser({ fcmToken: null });

            const res = await request(app)
                .get('/api/notifications/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats).toBeDefined();
            expect(typeof res.body.stats.totalUsers).toBe('number');
            expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
            expect(typeof res.body.stats.registeredDevices).toBe('number');
            expect(res.body.stats.registeredDevices).toBeGreaterThanOrEqual(1);
            expect(typeof res.body.stats.firebaseConfigured).toBe('boolean');
            expect(res.body.stats.firebaseConfigured).toBe(false);
        });

        it('reports firebaseConfigured as true when Firebase Admin SDK is ready', async () => {
            const mockMessaging = { send: jest.fn() };
            fcmService._setMessagingInstanceForTesting(mockMessaging);

            const { token: adminToken } = await createTestAdmin();

            const res = await request(app)
                .get('/api/notifications/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats.firebaseConfigured).toBe(true);
        });
    });

    describe('POST /api/notifications/broadcast', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/notifications/broadcast')
                .send({ title: 'Alert', body: 'Test announcement' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects student requests with 403 forbidden', async () => {
            const { token } = await createTestUser({ role: 'student' });

            const res = await request(app)
                .post('/api/notifications/broadcast')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Alert', body: 'Test announcement' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('rejects missing title or body with 400', async () => {
            const { token: adminToken } = await createTestAdmin();

            const resNoTitle = await request(app)
                .post('/api/notifications/broadcast')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ body: 'Missing title message' });

            expect(resNoTitle.status).toBe(400);
            expect(resNoTitle.body.success).toBe(false);
            expect(resNoTitle.body.message).toMatch(/title is required/i);

            const resNoBody = await request(app)
                .post('/api/notifications/broadcast')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Title only' });

            expect(resNoBody.status).toBe(400);
            expect(resNoBody.body.success).toBe(false);
            expect(resNoBody.body.message).toMatch(/body is required/i);
        });

        it('dispatches broadcast notification to all devices and all_users topic', async () => {
            const tokenA = 'fcm_broadcast_dev_1';
            const tokenB = 'fcm_broadcast_dev_2';
            await createTestUser({ fcmToken: tokenA });
            await createTestUser({ fcmToken: tokenB });
            const { token: adminToken } = await createTestAdmin();

            let capturedMulticast = null;
            let capturedTopic = null;
            const mockMessaging = {
                sendEachForMulticast: jest.fn().mockImplementation(async (msg) => {
                    capturedMulticast = msg;
                    return {
                        successCount: msg.tokens.length,
                        failureCount: 0,
                        responses: msg.tokens.map(() => ({ success: true, messageId: 'broadcast_msg_ok' })),
                    };
                }),
                send: jest.fn().mockImplementation(async (msg) => {
                    capturedTopic = msg;
                    return 'broadcast_topic_msg_ok';
                }),
            };
            fcmService._setMessagingInstanceForTesting(mockMessaging);

            const res = await request(app)
                .post('/api/notifications/broadcast')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: '📢 Special Event',
                    body: 'Double XP weekend starts now!',
                    route: '/leagues',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Broadcast notification sent successfully');
            expect(res.body.recipientCount).toBeGreaterThanOrEqual(2);
            expect(res.body.result).toBeDefined();

            expect(capturedMulticast).toBeDefined();
            expect(capturedMulticast.notification.title).toBe('📢 Special Event');
            expect(capturedMulticast.notification.body).toBe('Double XP weekend starts now!');
            expect(capturedMulticast.data.route).toBe('/leagues');
            expect(capturedMulticast.tokens).toContain(tokenA);
            expect(capturedMulticast.tokens).toContain(tokenB);

            expect(capturedTopic).toBeDefined();
            expect(capturedTopic.topic).toBe('all_users');
            expect(capturedTopic.notification.title).toBe('📢 Special Event');
        });

        it('defaults route to /home when unspecified', async () => {
            await createTestUser({ fcmToken: 'fcm_dev_home_default' });
            const { token: adminToken } = await createTestAdmin();

            let capturedMulticast = null;
            const mockMessaging = {
                sendEachForMulticast: jest.fn().mockImplementation(async (msg) => {
                    capturedMulticast = msg;
                    return {
                        successCount: msg.tokens.length,
                        failureCount: 0,
                        responses: msg.tokens.map(() => ({ success: true, messageId: 'msg_ok' })),
                    };
                }),
                send: jest.fn().mockResolvedValue('topic_ok'),
            };
            fcmService._setMessagingInstanceForTesting(mockMessaging);

            const res = await request(app)
                .post('/api/notifications/broadcast')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Default Route Test',
                    body: 'Navigates to home by default',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(capturedMulticast.data.route).toBe('/home');
        });
    });

    describe('GET /api/notifications/templates', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .get('/api/notifications/templates');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects student requests with 403 forbidden', async () => {
            const { token } = await createTestUser({ role: 'student' });

            const res = await request(app)
                .get('/api/notifications/templates')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('returns automated notification templates for admin', async () => {
            const { token: adminToken } = await createTestAdmin();

            const res = await request(app)
                .get('/api/notifications/templates')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.templates).toBeDefined();
            expect(res.body.templates.streak_reminder).toBeDefined();
            expect(res.body.templates.streak_reminder.title).toMatch(/streak/i);
            expect(res.body.templates.oxygen_full).toBeDefined();
            expect(res.body.templates.oxygen_full.title).toMatch(/oxygen/i);
            expect(res.body.templates.league_alert).toBeDefined();
            expect(res.body.templates.league_alert.title).toMatch(/league/i);
        });
    });

    describe('PUT /api/notifications/templates', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .put('/api/notifications/templates')
                .send({ templates: {} });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects student requests with 403 forbidden', async () => {
            const { token } = await createTestUser({ role: 'student' });

            const res = await request(app)
                .put('/api/notifications/templates')
                .set('Authorization', `Bearer ${token}`)
                .send({ streak_reminder: { enabled: false } });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('rejects invalid or empty template payload with 400', async () => {
            const { token: adminToken } = await createTestAdmin();

            const res = await request(app)
                .put('/api/notifications/templates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid templates payload/i);
        });

        it('updates, persists, and returns updated notification templates', async () => {
            const { token: adminToken } = await createTestAdmin();

            const updatePayload = {
                streak_reminder: {
                    title: '🔥 Custom Streak Title!',
                    body: 'Don’t forget your German practice!',
                    time: '19:30',
                    enabled: false,
                },
            };

            const putRes = await request(app)
                .put('/api/notifications/templates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePayload);

            expect(putRes.status).toBe(200);
            expect(putRes.body.success).toBe(true);
            expect(putRes.body.message).toBe('Notification templates updated successfully');
            expect(putRes.body.templates.streak_reminder.title).toBe('🔥 Custom Streak Title!');
            expect(putRes.body.templates.streak_reminder.body).toBe('Don’t forget your German practice!');
            expect(putRes.body.templates.streak_reminder.time).toBe('19:30');
            expect(putRes.body.templates.streak_reminder.enabled).toBe(false);
            // Non-updated templates must remain intact
            expect(putRes.body.templates.oxygen_full).toBeDefined();

            // Verify persistence via GET request
            const getRes = await request(app)
                .get('/api/notifications/templates')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.templates.streak_reminder.title).toBe('🔥 Custom Streak Title!');
            expect(getRes.body.templates.streak_reminder.enabled).toBe(false);
        });
    });

    describe('fcmService Unit Tests', () => {
        describe('sendToUser', () => {
            it('returns unconfigured if messaging cannot be initialized', async () => {
                const res = await fcmService.sendToUser(99999, { title: 'Test', body: 'Test' });
                expect(res).toEqual({ success: false, reason: 'unconfigured' });
            });

            it('returns user_not_found if user does not exist', async () => {
                const mockMessaging = { send: jest.fn() };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const res = await fcmService.sendToUser(99999, { title: 'Test', body: 'Test' });
                expect(res).toEqual({ success: false, reason: 'user_not_found' });
            });

            it('returns no_token if user has null fcmToken', async () => {
                const mockMessaging = { send: jest.fn() };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const { user } = await createTestUser({ fcmToken: null });
                const res = await fcmService.sendToUser(user.id, { title: 'Test', body: 'Test' });
                expect(res).toEqual({ success: false, reason: 'no_token' });
            });

            it('auto-prunes stale token on registration-token-not-registered error', async () => {
                const staleError = new Error('The registration token is not registered');
                staleError.code = 'messaging/registration-token-not-registered';

                const mockMessaging = {
                    send: jest.fn().mockRejectedValue(staleError),
                };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const { user } = await createTestUser({ fcmToken: 'stale_token_123' });
                const res = await fcmService.sendToUser(user.id, { title: 'Test', body: 'Test' });

                expect(res.success).toBe(false);
                expect(res.pruned).toBe(true);
                expect(res.reason).toBe('stale_token_pruned');

                const refreshedUser = await User.findByPk(user.id);
                expect(refreshedUser.fcmToken).toBeNull();
            });

            it('auto-prunes stale token on messaging/invalid-registration-token error', async () => {
                const invalidError = new Error('Invalid token');
                invalidError.code = 'messaging/invalid-registration-token';

                const mockMessaging = {
                    send: jest.fn().mockRejectedValue(invalidError),
                };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const { user } = await createTestUser({ fcmToken: 'invalid_token_456' });
                const res = await fcmService.sendToUser(user.id, { title: 'Test', body: 'Test' });

                expect(res.success).toBe(false);
                expect(res.pruned).toBe(true);

                const refreshedUser = await User.findByPk(user.id);
                expect(refreshedUser.fcmToken).toBeNull();
            });

            it('handles generic Firebase errors without throwing', async () => {
                const networkError = new Error('Internal Firebase Server Error');
                networkError.code = 'messaging/internal-error';

                const mockMessaging = {
                    send: jest.fn().mockRejectedValue(networkError),
                };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const { user } = await createTestUser({ fcmToken: 'regular_token_789' });
                const res = await fcmService.sendToUser(user.id, { title: 'Test', body: 'Test' });

                expect(res.success).toBe(false);
                expect(res.error).toBe('messaging/internal-error');

                // Token is NOT pruned for temporary server errors
                const refreshedUser = await User.findByPk(user.id);
                expect(refreshedUser.fcmToken).toBe('regular_token_789');
            });
        });

        describe('sendMulticast', () => {
            it('returns no_tokens when empty array is passed', async () => {
                const res = await fcmService.sendMulticast([]);
                expect(res).toEqual({ success: false, reason: 'no_tokens' });
            });

            it('returns unconfigured if messaging is not initialized', async () => {
                const res = await fcmService.sendMulticast(['token_1', 'token_2']);
                expect(res).toEqual({ success: false, reason: 'unconfigured' });
            });

            it('sends multicast and auto-prunes invalid tokens from database', async () => {
                const { user: u1 } = await createTestUser({ fcmToken: 'stale_token_A' });
                const { user: u2 } = await createTestUser({ fcmToken: 'valid_token_B' });

                const mockMessaging = {
                    sendEachForMulticast: jest.fn().mockResolvedValue({
                        successCount: 1,
                        failureCount: 1,
                        responses: [
                            {
                                success: false,
                                error: { code: 'messaging/registration-token-not-registered' },
                            },
                            {
                                success: true,
                                messageId: 'msg_valid_b',
                            },
                        ],
                    }),
                };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const res = await fcmService.sendMulticast(['stale_token_A', 'valid_token_B'], {
                    title: 'Multicast Alert',
                    body: 'New lesson available!',
                    data: { lessonId: 42 },
                });

                expect(res.success).toBe(true);
                expect(res.successCount).toBe(1);
                expect(res.failureCount).toBe(1);
                expect(res.staleTokensPruned).toBe(1);

                const refreshedU1 = await User.findByPk(u1.id);
                const refreshedU2 = await User.findByPk(u2.id);
                expect(refreshedU1.fcmToken).toBeNull();
                expect(refreshedU2.fcmToken).toBe('valid_token_B');
            });
        });

        describe('sendToTopic', () => {
            it('returns no_topic when topic is missing or invalid', async () => {
                const res = await fcmService.sendToTopic('');
                expect(res).toEqual({ success: false, reason: 'no_topic' });
            });

            it('returns unconfigured when Firebase is not initialized', async () => {
                const res = await fcmService.sendToTopic('announcements');
                expect(res).toEqual({ success: false, reason: 'unconfigured' });
            });

            it('sends message to topic stripping /topics/ prefix safely', async () => {
                let sentMessage = null;
                const mockMessaging = {
                    send: jest.fn().mockImplementation(async (msg) => {
                        sentMessage = msg;
                        return 'topic_msg_id_777';
                    }),
                };
                fcmService._setMessagingInstanceForTesting(mockMessaging);

                const res = await fcmService.sendToTopic('/topics/german_announcements', {
                    title: 'Wichtige Mitteilung',
                    body: 'Neue Übungen sind online!',
                    data: { category: 'updates' },
                });

                expect(res.success).toBe(true);
                expect(res.messageId).toBe('topic_msg_id_777');
                expect(sentMessage.topic).toBe('german_announcements');
                expect(sentMessage.data.category).toBe('updates');
                expect(sentMessage.android.priority).toBe('high');
            });
        });
    });

    describe('notificationTemplates Service Unit Tests', () => {
        it('returns complete default templates with streak, oxygen, and league alert keys', () => {
            const defaults = notificationTemplates.getDefaultTemplates();
            expect(defaults).toBeDefined();
            expect(defaults.streak_reminder).toBeDefined();
            expect(defaults.streak_reminder.title).toContain('streak');
            expect(defaults.oxygen_full).toBeDefined();
            expect(defaults.oxygen_full.title).toContain('Oxygen');
            expect(defaults.league_alert).toBeDefined();
            expect(defaults.league_alert.title).toContain('League');
        });

        it('safely falls back to default templates when file does not exist or has invalid JSON', () => {
            // Non-existent file test
            const templatesWhenMissing = notificationTemplates.getTemplates();
            expect(templatesWhenMissing.streak_reminder).toBeDefined();

            // Corrupt file test
            const storagePath = notificationTemplates.getStoragePath();
            fs.writeFileSync(storagePath, 'invalid json content {}', 'utf8');

            const templatesWhenCorrupt = notificationTemplates.getTemplates();
            expect(templatesWhenCorrupt.streak_reminder).toBeDefined();
            expect(templatesWhenCorrupt.streak_reminder.enabled).toBe(true);
        });

        it('persists and deep-merges partial template updates without dropping untouched keys', () => {
            const saved = notificationTemplates.saveTemplates({
                streak_reminder: {
                    title: 'New Streak Title',
                    time: '18:00',
                },
            });

            expect(saved.streak_reminder.title).toBe('New Streak Title');
            expect(saved.streak_reminder.time).toBe('18:00');
            expect(saved.streak_reminder.body).toBeDefined(); // Retained default body
            expect(saved.oxygen_full).toBeDefined(); // Retained default oxygen_full

            // Verify disk persistence
            const readBack = notificationTemplates.getTemplates();
            expect(readBack.streak_reminder.title).toBe('New Streak Title');
            expect(readBack.streak_reminder.time).toBe('18:00');
        });

        it('throws an error when invalid template data is provided to saveTemplates', () => {
            expect(() => notificationTemplates.saveTemplates(null)).toThrow(/invalid template data/i);
            expect(() => notificationTemplates.saveTemplates('invalid string')).toThrow(/invalid template data/i);
            expect(() => notificationTemplates.saveTemplates([1, 2, 3])).toThrow(/invalid template data/i);
        });

        it('clears persisted file and restores defaults with resetToDefaults', () => {
            notificationTemplates.saveTemplates({
                streak_reminder: {
                    title: 'Temporary Modified Title',
                },
            });

            const reset = notificationTemplates.resetToDefaults();
            expect(reset.streak_reminder.title).toBe(notificationTemplates.DEFAULT_TEMPLATES.streak_reminder.title);

            const reloaded = notificationTemplates.getTemplates();
            expect(reloaded.streak_reminder.title).toBe(notificationTemplates.DEFAULT_TEMPLATES.streak_reminder.title);
        });
    });
});
