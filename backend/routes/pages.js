const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const {
    getAllPages,
    getPageById,
    createPage,
    updatePage,
    deletePage,
    uploadImage,
    getPublicPageBySlug,
} = require('../controllers/pageController');

const { protect, authorize } = require('../middleware/auth');

// Ensure uploads/pages directory exists
const uploadDir = path.join(__dirname, '../uploads/pages');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for page images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `page-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg\+xml|svg/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, GIF, WebP, SVG) are allowed!'));
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter,
});

// 1. Public route - accessible without login
router.get('/public/:slug', getPublicPageBySlug);

// 2. Admin routes - protected
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllPages);
router.post('/', createPage);
router.post('/upload-image', upload.single('image'), uploadImage);
router.get('/:id', getPageById);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

module.exports = router;
