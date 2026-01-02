const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/categoryService');

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json(
    new ApiResponse(201, { category }, 'Category created successfully')
  );
});

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories(req.query);

  res.status(200).json(
    new ApiResponse(200, { categories, count: categories.length }, 'Categories fetched successfully')
  );
});

// @desc    Get category by ID
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category fetched successfully')
  );
});

// @desc    Get category by slug
// @route   GET /api/v1/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category fetched successfully')
  );
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category updated successfully')
  );
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);

  res.status(200).json(
    new ApiResponse(200, result, 'Category deleted successfully')
  );
});

// @desc    Get category tree
// @route   GET /api/v1/categories/tree/all
// @access  Public
exports.getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree();

  res.status(200).json(
    new ApiResponse(200, { categories: tree }, 'Category tree fetched successfully')
  );
});

// @desc    Get categories with product counts
// @route   GET /api/v1/categories/counts/all
// @access  Public
exports.getCategoriesWithCounts = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategoriesWithCounts();

  res.status(200).json(
    new ApiResponse(200, { categories }, 'Categories with counts fetched successfully')
  );
});
