const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const Category = require("../models/Category");

class ProductService {
  async createProduct(productData, userId) {
    productData.user = userId;

    // ✅ Validate category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const product = await Product.create(productData);

    // Populate category before returning
    await product.populate("category", "name displayName slug");

    return product;
  }

  // async getAllProducts(queryParams, userId, userRole) {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     search,
  //     category,
  //     minPrice,
  //     maxPrice,
  //     sortBy = "createdAt",
  //     sortOrder = "desc",
  //     brand,
  //     inStock,
  //     color,
  //   } = queryParams;

  //   // Build filter object
  //   const filter = {};

  //   // If user is not admin, only show their products
  //   if (userRole !== "admin") {
  //     filter.user = userId;
  //   }

  //   // Search functionality
  //   if (search) {
  //     filter.$text = { $search: search };
  //   }

  //   // Category filter
  //   if (category) {
  //     filter.category = category;
  //   }

  //   // Price range filter
  //   if (minPrice || maxPrice) {
  //     filter.price = {};
  //     if (minPrice) filter.price.$gte = Number(minPrice);
  //     if (maxPrice) filter.price.$lte = Number(maxPrice);
  //   }

  //   // Brand filter
  //   if (brand) {
  //     filter.brand = { $regex: brand, $options: "i" };
  //   }

  //   // Color filter - check if any variant has this color
  //   if (color) {
  //     filter["variants.color"] = { $regex: color, $options: "i" };
  //   }

  //   // Update getAllProducts method - price filtering
  //   if (minPrice || maxPrice) {
  //     filter.price = {}; // This is correct - use selling price for filtering
  //     if (minPrice) filter.price.$gte = Number(minPrice);
  //     if (maxPrice) filter.price.$lte = Number(maxPrice);
  //   }

  //   // Stock filter - check if any variant has stock > 0
  //   if (inStock === "true") {
  //     filter["variants"] = {
  //       $elemMatch: {
  //         stock: { $gt: 0 },
  //         isAvailable: true,
  //       },
  //     };
  //   }

  //   // Active products only
  //   filter.isActive = true;

  //   // Pagination
  //   const pageNum = parseInt(page, 10);
  //   const limitNum = parseInt(limit, 10);
  //   const skip = (pageNum - 1) * limitNum;

  //   // Sorting
  //   const sortOptions = {};
  //   sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  //   // Execute query
  //   const products = await Product.find(filter)
  //     .sort(sortOptions)
  //     .skip(skip)
  //     .limit(limitNum)
  //     .populate("user", "name email")
  //     .populate("category", "name displayName slug icon");

  //   // Get total count
  //   const total = await Product.countDocuments(filter);

  //   return {
  //     products,
  //     pagination: {
  //       total,
  //       page: pageNum,
  //       pages: Math.ceil(total / limitNum),
  //       limit: limitNum,
  //     },
  //   };
  // }

  // async getProductById(productId, userId, userRole) {
  //   const filter = { _id: productId };

  //   // If user is not admin, only allow viewing their own products
  //   if (userRole !== "admin") {
  //     filter.user = userId;
  //   }

  //   const product = await Product.findOne(filter).populate(
  //     "user",
  //     "name email"
  //   );

  //   if (!product) {
  //     throw new ApiError(404, "Product not found");
  //   }

  //   return product;
  // }


  async getAllProducts(queryParams) {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    sortOrder = "desc",
    brand,
    inStock,
    color,
  } = queryParams;

  const filter = {
    isActive: true, // PUBLIC: only active products
  };

  // 🔍 Search (requires text index)
  if (search) {
    filter.$text = { $search: search };
  }

  // 📦 Category filter
  if (category) {
    filter.category = category;
  }

  // 💰 Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // 🏷 Brand filter
  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }

  // 🎨 Variant color filter
  if (color) {
    filter["variants.color"] = { $regex: color, $options: "i" };
  }

  // 📦 In-stock products
  if (inStock === "true") {
    filter.variants = {
      $elemMatch: {
        stock: { $gt: 0 },
        isAvailable: true,
      },
    };
  }

  // 📄 Pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  // 🔃 Sorting
  const sortOptions = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
  };

  // 🚀 Query
  const products = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate("category", "name displayName slug icon")
    .lean();

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  };
}


async getProductById(productId) {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })
    .populate("category", "name displayName slug icon")
    .populate("user", "name") // optional
    .lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
}


  async updateProduct(productId, updateData, userId, userRole) {
    const filter = { _id: productId };

    // If user is not admin, only allow updating their own products
    if (userRole !== "admin") {
      filter.user = userId;
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found or unauthorized");
    }

    return product;
  }

  async deleteProduct(productId, userId, userRole) {
    const filter = { _id: productId };

    // If user is not admin, only allow deleting their own products
    if (userRole !== "admin") {
      filter.user = userId;
    }

    const product = await Product.findOneAndDelete(filter);

    if (!product) {
      throw new ApiError(404, "Product not found or unauthorized");
    }

    return { message: "Product deleted successfully" };
  }

  async getProductStats(userId, userRole) {
    const filter = userRole === "admin" ? {} : { user: userId };

    // Aggregate total stock from variants
    const stats = await Product.aggregate([
      { $match: filter },
      {
        $project: {
          mrp: 1, // Use MRP for total value
          price: 1, // Selling price
          category: 1,
          totalStock: {
            $sum: "$variants.stock",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          // Use MRP for total catalog value
          totalCatalogValue: { $sum: { $multiply: ["$mrp", "$totalStock"] } },
          // Use selling price for total revenue potential
          totalRevenuePotential: {
            $sum: { $multiply: ["$price", "$totalStock"] },
          },
          averageMRP: { $avg: "$mrp" },
          averagePrice: { $avg: "$price" },
          totalStock: { $sum: "$totalStock" },
        },
      },
    ]);

    const categoryStats = await Product.aggregate([
      { $match: filter },
      {
        $project: {
          category: 1,
          price: 1,
          totalStock: {
            $sum: "$variants.stock",
          },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: {
            $sum: { $multiply: ["$price", "$totalStock"] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      overall: stats[0] || {
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        totalStock: 0,
      },
      byCategory: categoryStats,
    };
  }

  // NEW: Update specific variant stock
  async updateVariantStock(productId, color, newStock, userId, userRole) {
    const filter = { _id: productId };

    if (userRole !== "admin") {
      filter.user = userId;
    }

    const product = await Product.findOne(filter);

    if (!product) {
      throw new ApiError(404, "Product not found or unauthorized");
    }

    const variant = product.variants.find(
      (v) => v.color.toLowerCase() === color.toLowerCase()
    );

    if (!variant) {
      throw new ApiError(404, `Color variant '${color}' not found`);
    }

    variant.stock = newStock;
    await product.save();

    return product;
  }

  // NEW: Get products by color
  async getProductsByColor(color, userId, userRole) {
    const filter = {
      "variants.color": { $regex: color, $options: "i" },
      isActive: true,
    };

    if (userRole !== "admin") {
      filter.user = userId;
    }

    const products = await Product.find(filter).populate("user", "name email");
    return products;
  }

  // NEW: Check variant availability
  async checkVariantAvailability(productId, color) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const variant = product.variants.find(
      (v) => v.color.toLowerCase() === color.toLowerCase()
    );

    if (!variant) {
      throw new ApiError(404, `Color variant '${color}' not found`);
    }

    return {
      available: variant.stock > 0 && variant.isAvailable,
      stock: variant.stock,
      color: variant.color,
      colorCode: variant.colorCode,
    };
  }
}

module.exports = new ProductService();
