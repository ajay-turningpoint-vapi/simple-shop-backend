const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const Category = require("../models/Category");
const cache = require("../utils/cache");

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


    // Invalidate product list caches and set the single product cache
    await cache.delPattern('products:*');
    await cache.set(`product:${product._id}`, product.toObject ? product.toObject() : product, 3600);

    return product;
  }




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

    // Deterministic cache key
    const cacheKey = `products:${page}:${limit}:${search || ''}:${category || ''}:${minPrice || ''}:${maxPrice || ''}:${sortBy}:${sortOrder}:${brand || ''}:${inStock || ''}:${color || ''}`;

    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    console.log("cached",cached);
    

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

    const result = {
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };

    // Cache result (short TTL)
    await cache.set(cacheKey, result, 300);

    return result;
  }


  async getProductById(productId) {

    const cacheKey = `product:${productId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

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

    await cache.set(cacheKey, product, 3600);
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


    // Invalidate listings and update product cache
    await cache.delPattern('products:*');
    await cache.set(`product:${product._id}`, product.toObject ? product.toObject() : product, 3600);

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


    await cache.delPattern('products:*');
    await cache.del(`product:${product._id}`);

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


    await cache.delPattern('products:*');
    await cache.set(`product:${product._id}`, product.toObject ? product.toObject() : product, 3600);

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
