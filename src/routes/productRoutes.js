const express = require("express");
const { body, query } = require("express-validator");
const productController = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validator");

const router = express.Router();

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  // MRP is now REQUIRED
  body("mrp")
    .notEmpty()
    .withMessage("MRP is required")
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive number"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .custom((value, { req }) => {
      if (req.body.mrp && value > req.body.mrp) {
        throw new Error("Price cannot be higher than MRP");
      }
      return true;
    }),
  // Discount percent validation
  body("discountPercent")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100"),
 body('category')
  .notEmpty().withMessage('Category is required')
  .isMongoId().withMessage('Invalid category ID'),  

  body("brand").optional().trim(),
  ,
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),

  // Variants validation
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.color")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant color is required"),
  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be a non-negative integer"),
  body("variants.*.colorCode").optional().trim(),
  body("variants.*.sku").optional().trim(),
  body("variants.*.images")
    .optional()
    .isArray()
    .withMessage("Variant images must be an array"),
];

const updateProductValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Product name cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("mrp")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("MRP must be a positive number"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .custom((value, { req }) => {
      if (req.body.mrp && value > req.body.mrp) {
        throw new Error("Selling price cannot exceed MRP");
      }
      return true;
    }),
  body("discountPercent")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percent must be 0-100"),
 body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
 
  // Variants validation
  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.color")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant color is required"),
  body("variants.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variant stock must be a non-negative integer"),
  body("variants.*.colorCode").optional().trim(),
  body("variants.*.sku").optional().trim(),
];

const queryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "mrp", "createdAt"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
  query("color").optional().trim(),
];

// Routes - Stats must come before :id route to avoid conflict
router.get("/stats/overview", protect, productController.getProductStats);

router
  .route("/")
  .post(
    protect,
    createProductValidation,
    validate,
    productController.createProduct
  )
  .get( queryValidation, validate, productController.getAllProducts);

router
  .route("/:id")
  .get( productController.getProductById)
  .put(
    protect,
    updateProductValidation,
    validate,
    productController.updateProduct
  )
  .delete(protect, productController.deleteProduct);

// Add these before module.exports

// Variant-specific routes
router.put(
  "/:id/variants/:color/stock",
  protect,
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be non-negative integer"),
  validate,
  productController.updateVariantStock
);

router.get(
  "/:id/variants/:color/availability",
  protect,
  productController.checkVariantAvailability
);

router.get("/color/:color", protect, productController.getProductsByColor);

module.exports = router;
