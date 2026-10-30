/**
 * DolphinCoder LMS — Push Notification Controller
 * 
 * Handles registration, unregistration, and diagnostic testing of
 * Firebase Cloud Messaging device tokens for authenticated users.
 */

const { Op } = require('sequelize');
const User = require('../models/User');
const fcmService = require('../services/fcmService');
const notificationTemplates = require('../services/notificationTemplates');

/**
 * @desc    Register or update FCM device token for the authenticated user
 * @route   POST /api/notifications/register-token
 * @access  Private
 */
const registerFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken || typeof fcmToken !== 'string' || !fcmToken.trim()) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required',
            });
        }

        const trimmedToken = fcmToken.trim();
        if (trimmedToken.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'FCM token exceeds maximum allowed length of 500 characters',
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.fcmToken = trimmedToken;
        await user.save();

        return res.json({
            success: true,
            message: 'FCM token registered successfully',
        });
    } catch (error) {
        console.error('Error in registerFcmToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register FCM token',
            error: error.message,
        });
    }
};

/**
 * @desc    Unregister (nullify) FCM device token for the authenticated user
 * @route   POST /api/notifications/unregister-token
 * @access  Private
 */
const unregisterFcmToken = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.fcmToken = null;
        await user.save();

        return res.json({
            success: true,
            message: 'FCM token unregistered successfully',
        });
    } catch (error) {
        console.error('Error in unregisterFcmToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unregister FCM token',
            error: error.message,
        });
    }
};

/**
 * @desc    Send a diagnostic test notification to the authenticated user's registered device
 * @route   POST /api/notifications/send-test
 * @access  Private
 */
const sendTestNotification = async (req, res) => {
    try {
        const result = await fcmService.sendToUser(req.user.id, {
            title: '🔔 DolphinCoder Test',
            body: 'Push notifications are working perfectly!',
            data: { route: '/home' },
        });

        return res.json({
            success: result.success,
            ...result,
        });
    } catch (error) {
        console.error('Error in sendTestNotification:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to dispatch test notification',
            error: error.message,
        });
    }
};

/**
 * @desc    Get notification stats and device metrics (admin only)
 * @route   GET /api/notifications/stats
 * @access  Private (Admin)
 */
const getNotificationStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const registeredDevices = await User.count({
            where: {
                fcmToken: { [Op.ne]: null },
            },
        });
        const firebaseConfigured = fcmService.isConfigured();

        return res.json({
            success: true,
            stats: {
                totalUsers,
                registeredDevices,
                firebaseConfigured,
            },
        });
    } catch (error) {
        console.error('Error in getNotificationStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification statistics',
            error: error.message,
        });
    }
};

/**
 * @desc    Broadcast a push notification to all registered devices and topic (admin only)
 * @route   POST /api/notifications/broadcast
 * @access  Private (Admin)
 */
const broadcastNotification = async (req, res) => {
    try {
        const { title, body, route } = req.body || {};

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Notification title is required',
            });
        }

        if (!body || typeof body !== 'string' || !body.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Notification body is required',
            });
        }

        const trimmedTitle = title.trim();
        const trimmedBody = body.trim();
        const targetRoute = (route && typeof route === 'string' && route.trim()) ? route.trim() : '/home';

        // Query all users with registered FCM tokens
        const usersWithTokens = await User.findAll({
            attributes: ['id', 'fcmToken'],
            where: {
                fcmToken: { [Op.ne]: null },
            },
        });

        const tokens = usersWithTokens
            .map(u => u.fcmToken)
            .filter(t => typeof t === 'string' && t.trim().length > 0);

        const pushPayload = {
            title: trimmedTitle,
            body: trimmedBody,
            data: { route: targetRoute },
        };

        let result = null;
        if (tokens.length > 0) {
            result = await fcmService.sendMulticast(tokens, pushPayload);
        } else {
            result = {
                success: true,
                successCount: 0,
                failureCount: 0,
                message: 'No registered devices found',
            };
        }

        // Also broadcast to the all_users general topic
        try {
            await fcmService.sendToTopic('all_users', pushPayload);
        } catch (topicErr) {
            console.warn('⚠️ [FCM Broadcast] Topic dispatch warning:', topicErr.message);
        }

        return res.json({
            success: true,
            message: 'Broadcast notification sent successfully',
            recipientCount: tokens.length,
            result,
        });
    } catch (error) {
        console.error('Error in broadcastNotification:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to broadcast notification',
            error: error.message,
        });
    }
};

/**
 * @desc    Get configurable automated notification templates (admin only)
 * @route   GET /api/notifications/templates
 * @access  Private (Admin)
 */
const getTemplates = async (req, res) => {
    try {
        const templates = notificationTemplates.getTemplates();
        return res.json({
            success: true,
            templates,
        });
    } catch (error) {
        console.error('Error in getTemplates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification templates',
            error: error.message,
        });
    }
};

/**
 * @desc    Save updated automated notification templates (admin only)
 * @route   PUT /api/notifications/templates
 * @access  Private (Admin)
 */
const updateTemplates = async (req, res) => {
    try {
        const payload = req.body && req.body.templates ? req.body.templates : req.body;

        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid templates payload: expected an object containing notification templates',
            });
        }

        const updatedTemplates = notificationTemplates.saveTemplates(payload);

        return res.json({
            success: true,
            message: 'Notification templates updated successfully',
            templates: updatedTemplates,
        });
    } catch (error) {
        console.error('Error in updateTemplates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update notification templates',
            error: error.message,
        });
    }
};

module.exports = {
    registerFcmToken,
    unregisterFcmToken,
    sendTestNotification,
    getNotificationStats,
    broadcastNotification,
    getTemplates,
    updateTemplates,
};
