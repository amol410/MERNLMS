const { Op } = require('sequelize');
const Page = require('../models/Page');
const User = require('../models/User');
const { pingIndexNow } = require('../utils/seoHelper');

const RESERVED_SLUGS = new Set([
    'dashboard',
    'notes',
    'videos',
    'quizzes',
    'flashcards',
    'lingodolphy',
    'lessons',
    'admin',
    'profile',
    'activity',
    'history',
    'login',
    'register',
    'api',
    'uploads',
    'p',
    'pages',
    'settings',
    'logout',
    'auth',
]);

const sanitizeSlug = (raw) => {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

// @desc    Get all pages (Admin)
// @route   GET /api/pages
// @access  Private (Admin)
exports.getAllPages = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const where = {};

        if (status && (status === 'draft' || status === 'published')) {
            where.status = status;
        }

        if (search && search.trim()) {
            const query = `%${search.trim()}%`;
            where[Op.or] = [
                { title: { [Op.like]: query } },
                { slug: { [Op.like]: query } },
            ];
        }

        const pages = await Page.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email'],
                },
            ],
            order: [['updatedAt', 'DESC']],
        });

        res.json({
            success: true,
            count: pages.length,
            pages,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get page by ID (Admin)
// @route   GET /api/pages/:id
// @access  Private (Admin)
exports.getPageById = async (req, res, next) => {
    try {
        const page = await Page.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found',
            });
        }

        res.json({
            success: true,
            page,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new page (Admin)
// @route   POST /api/pages
// @access  Private (Admin)
exports.createPage = async (req, res, next) => {
    try {
        const { title, slug, content, summary, featuredImage, status } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Page title is required',
            });
        }

        const cleanSlug = sanitizeSlug(slug || title);
        if (!cleanSlug) {
            return res.status(400).json({
                success: false,
                message: 'A valid URL slug is required',
            });
        }

        if (RESERVED_SLUGS.has(cleanSlug)) {
            return res.status(400).json({
                success: false,
                message: `The slug "${cleanSlug}" is reserved by the system. Please choose a different URL.`,
            });
        }

        const existing = await Page.findOne({ where: { slug: cleanSlug } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `A page with URL "/${cleanSlug}" already exists.`,
            });
        }

        const isPublished = status === 'published';
        const page = await Page.create({
            title: title.trim(),
            slug: cleanSlug,
            content: content || '',
            summary: summary || null,
            featuredImage: featuredImage || null,
            status: isPublished ? 'published' : 'draft',
            publishedAt: isPublished ? new Date() : null,
            authorId: req.user ? req.user.id : null,
        });

        if (isPublished) {
            pingIndexNow(cleanSlug);
        }

        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            page,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a page (Admin)
// @route   PUT /api/pages/:id
// @access  Private (Admin)
exports.updatePage = async (req, res, next) => {
    try {
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found',
            });
        }

        const { title, slug, content, summary, featuredImage, status } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Page title cannot be empty',
                });
            }
            page.title = title.trim();
        }

        if (slug !== undefined) {
            const cleanSlug = sanitizeSlug(slug);
            if (!cleanSlug) {
                return res.status(400).json({
                    success: false,
                    message: 'A valid URL slug is required',
                });
            }

            if (RESERVED_SLUGS.has(cleanSlug)) {
                return res.status(400).json({
                    success: false,
                    message: `The slug "${cleanSlug}" is reserved by the system. Please choose a different URL.`,
                });
            }

            if (cleanSlug !== page.slug) {
                const existing = await Page.findOne({
                    where: {
                        slug: cleanSlug,
                        id: { [Op.ne]: page.id },
                    },
                });

                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: `A page with URL "/${cleanSlug}" already exists.`,
                    });
                }
                page.slug = cleanSlug;
            }
        }

        if (content !== undefined) page.content = content;
        if (summary !== undefined) page.summary = summary;
        if (featuredImage !== undefined) page.featuredImage = featuredImage;

        if (status !== undefined) {
            if (status === 'published' && page.status !== 'published') {
                page.publishedAt = page.publishedAt || new Date();
            }
            page.status = status;
        }

        await page.save();

        if (page.status === 'published') {
            pingIndexNow(page.slug);
        }

        res.json({
            success: true,
            message: 'Page updated successfully',
            page,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a page (Admin)
// @route   DELETE /api/pages/:id
// @access  Private (Admin)
exports.deletePage = async (req, res, next) => {
    try {
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found',
            });
        }

        await page.destroy();

        res.json({
            success: true,
            message: 'Page deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload image for page/blog content
// @route   POST /api/pages/upload-image
// @access  Private (Admin)
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded',
            });
        }

        const relativeUrl = `/uploads/pages/${req.file.filename}`;
        res.status(200).json({
            success: true,
            url: relativeUrl,
            filename: req.file.filename,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Image upload failed',
            error: error.message,
        });
    }
};

// @desc    Get published page by custom slug (Public)
// @route   GET /api/pages/public/:slug
// @access  Public (No auth needed)
exports.getPublicPageBySlug = async (req, res, next) => {
    try {
        const cleanSlug = sanitizeSlug(req.params.slug);
        const page = await Page.findOne({
            where: {
                slug: cleanSlug,
                status: 'published',
            },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name'],
                },
            ],
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found or not published yet',
            });
        }

        res.json({
            success: true,
            page,
        });
    } catch (error) {
        next(error);
    }
};
