/**
 * DolphinCoder LMS — Push Notification Routes
 * 
 * Endpoints for registering, unregistering, and testing FCM device tokens,
 * plus administrative diagnostic stats, broadcast dispatch, and notification templates.
 * All notification endpoints are protected by authentication middleware.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    registerFcmToken,
    unregisterFcmToken,
    sendTestNotification,
    getNotificationStats,
    broadcastNotification,
    getTemplates,
    updateTemplates,
} = require('../controllers/notificationController');

// Protect all notification routes
router.use(protect);

// Student & User routes
router.post('/register-token', registerFcmToken);
router.post('/unregister-token', unregisterFcmToken);
router.post('/send-test', sendTestNotification);

// Admin-only push notification management routes
router.get('/stats', authorize('admin'), getNotificationStats);
router.post('/broadcast', authorize('admin'), broadcastNotification);
router.get('/templates', authorize('admin'), getTemplates);
router.put('/templates', authorize('admin'), updateTemplates);

module.exports = router;
