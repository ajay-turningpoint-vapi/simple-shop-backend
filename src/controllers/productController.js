const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const productService = require('../services/productService');

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.id);

  res.status(201).json(
    new ApiResponse(201, { product }, 'Product created successfully')
  );
});

// @desc    Get all products with filters
// @route   GET /api/v1/products
// @access  Private
exports.getAllProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query, req.user.id, req.user.role);

  res.status(200).json(
    new ApiResponse(200, result, 'Products fetched successfully')
  );
});

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Private
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user.id, req.user.role);

  res.status(200).json(
    new ApiResponse(200, { product }, 'Product fetched successfully')
  );
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user.id, req.user.role);

  res.status(200).json(
    new ApiResponse(200, { product }, 'Product updated successfully')
  );
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user.id, req.user.role);

  res.status(200).json(
    new ApiResponse(200, result, 'Product deleted successfully')
  );
});

// @desc    Get product statistics
// @route   GET /api/v1/products/stats/overview
// @access  Private
exports.getProductStats = asyncHandler(async (req, res) => {
  const stats = await productService.getProductStats(req.user.id, req.user.role);

  res.status(200).json(
    new ApiResponse(200, { stats }, 'Statistics fetched successfully')
  );
});


// Add these to the existing file

// @desc    Update variant stock
// @route   PUT /api/v1/products/:id/variants/:color/stock
// @access  Private
exports.updateVariantStock = asyncHandler(async (req, res) => {
  const { color } = req.params;
  const { stock } = req.body;
  
  const product = await productService.updateVariantStock(
    req.params.id, 
    color, 
    stock, 
    req.user.id, 
    req.user.role
  );

  res.status(200).json(
    new ApiResponse(200, { product }, 'Variant stock updated successfully')
  );
});

// @desc    Check variant availability
// @route   GET /api/v1/products/:id/variants/:color/availability
// @access  Private
exports.checkVariantAvailability = asyncHandler(async (req, res) => {
  const { color } = req.params;
  
  const availability = await productService.checkVariantAvailability(
    req.params.id, 
    color
  );

  res.status(200).json(
    new ApiResponse(200, { availability }, 'Variant availability checked')
  );
});

// @desc    Get products by color
// @route   GET /api/v1/products/color/:color
// @access  Private
exports.getProductsByColor = asyncHandler(async (req, res) => {
  const { color } = req.params;
  
  const products = await productService.getProductsByColor(
    color, 
    req.user.id, 
    req.user.role
  );

  res.status(200).json(
    new ApiResponse(200, { products, count: products.length }, 'Products fetched by color')
  );
});

