const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getLessons,
    getLessonById,
    createLesson,
    updateLesson,
    toggleLiveStatus,
    deleteLesson,
    batchCreateHeadings,
    bulkUpload,
    getUnitsSummary,
    seedDefaultUnit,
} = require('../controllers/curriculumController');

// All curriculum endpoints require a valid user session
router.use(protect);

// Public/Learner & Staff endpoints (students only see isLive: true)
router.get('/lessons', getLessons);
router.get('/lessons/:id', getLessonById);
router.get('/units', getUnitsSummary);

// Staff-only management endpoints (Admin and Trainer)
router.post('/lessons', authorize('admin', 'trainer'), createLesson);
router.put('/lessons/:id', authorize('admin', 'trainer'), updateLesson);
router.patch('/lessons/:id/live', authorize('admin', 'trainer'), toggleLiveStatus);
router.delete('/lessons/:id', authorize('admin', 'trainer'), deleteLesson);

// Rapid batch outline of lesson headings for an entire unit (Default: isLive = false)
router.post('/units/headings', authorize('admin', 'trainer'), batchCreateHeadings);

// Bulk upload (CSV or JSON)
router.post('/bulk-upload', authorize('admin', 'trainer'), bulkUpload);

// Initial seeding helper
router.post('/seed-default', authorize('admin', 'trainer'), seedDefaultUnit);

module.exports = router;
