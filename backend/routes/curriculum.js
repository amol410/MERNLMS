const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');

// Multer in-memory storage for high-speed WebP Sharp compression
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max upload size
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif|svg/;
        const mimetype = allowed.test(file.mimetype) || allowed.test(file.originalname);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (JPG, PNG, WebP, GIF, SVG) are allowed'));
    },
});

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
    toggleUnitLiveStatus,
    deleteUnit,
    seedDefaultUnit,
    seedEnglish,
    uploadCurriculumImage,
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

// Unit management endpoints
router.patch('/units/:unitNumber/live', authorize('admin', 'trainer'), toggleUnitLiveStatus);
router.delete('/units/:unitNumber', authorize('admin', 'trainer'), deleteUnit);

// Rapid batch outline of lesson headings for an entire unit (Default: isLive = false)
router.post('/units/headings', authorize('admin', 'trainer'), batchCreateHeadings);

// Bulk upload (CSV or JSON)
router.post('/bulk-upload', authorize('admin', 'trainer'), bulkUpload);

// WebP image compression pipeline for Picture Vocabulary stages
router.post('/upload-image', authorize('admin', 'trainer'), upload.single('image'), uploadCurriculumImage);

// Initial seeding helpers
router.post('/seed-default', authorize('admin', 'trainer'), seedDefaultUnit);
router.post('/seed-english', authorize('admin', 'trainer'), seedEnglish);

module.exports = router;
