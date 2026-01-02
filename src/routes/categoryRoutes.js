const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isLength({ max: 50 }).withMessage('Display name cannot exceed 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('icon')
    .optional()
    .trim(),
  body('image')
    .optional()
    .trim(),
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Display name cannot exceed 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('parentCategory')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),
];

// Special routes first (before :id routes)
router.get('/tree/all', categoryController.getCategoryTree);
router.get('/counts/all', categoryController.getCategoriesWithCounts);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// CRUD routes
router.route('/')
  .get(categoryController.getAllCategories)
  .post(protect, authorize('admin'), createCategoryValidation, validate, categoryController.createCategory);

router.route('/:id')
  .get(categoryController.getCategoryById)
  .put(protect, authorize('admin'), updateCategoryValidation, validate, categoryController.updateCategory)
  .delete(protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
