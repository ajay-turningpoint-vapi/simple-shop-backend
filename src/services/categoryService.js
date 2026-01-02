const Category = require("../models/Category.js");
const ApiError = require("../utils/ApiError.js");
  const cache = require('../utils/cache');

class CategoryService {
  // Create new category
  async createCategory(categoryData) {
    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: categoryData.name.toLowerCase(),
    });

    if (existingCategory) {
      throw new ApiError(400, "Category already exists");
    }

    // If parent category is provided, validate it
    if (categoryData.parentCategory) {
      const parent = await Category.findById(categoryData.parentCategory);
      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }
      categoryData.level = parent.level + 1;
    }

    const category = await Category.create(categoryData);

    // Invalidate categories cache
  
    await cache.delPattern('categories:*');
    await cache.set(`category:${category._id}`, category.toObject ? category.toObject() : category, 3600);

    return category;
  }

  // Get all categories
  async getAllCategories(queryParams) {
  

    const {
      search,
      parentCategory,
      level,
      isActive, // ✅ Don't set default value here
      sortBy = "order",
      sortOrder = "asc",
    } = queryParams;

    const cacheKey = `categories:all:${search || ''}:${parentCategory || ''}:${level || ''}:${isActive || ''}:${sortBy}:${sortOrder}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    if (parentCategory !== undefined && parentCategory !== "") {
      filter.parentCategory = parentCategory === "null" ? null : parentCategory;
    }

    if (level !== undefined && level !== "") {
      filter.level = Number(level);
    }

    // ✅ FIXED: Only apply isActive filter if explicitly provided
    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true" || isActive === true;
    }
    // console.log("Category Filter:", filter); // removed debug log

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const categories = await Category.find(filter)
      .sort(sortOptions)
      .populate("parentCategory", "name displayName")
      .populate("subcategories");

    await cache.set(cacheKey, categories, 600);
    return categories;
  }

  // Get category by ID
  async getCategoryById(categoryId) {
  
    const cacheKey = `category:${categoryId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findById(categoryId)
      .populate("parentCategory", "name displayName")
      .populate("subcategories");

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    await cache.set(cacheKey, category, 3600);
    return category;
  }

  // Get category by slug
  async getCategoryBySlug(slug) {
  
    const cacheKey = `category:slug:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findOne({ slug })
      .populate("parentCategory", "name displayName")
      .populate("subcategories");

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    await cache.set(cacheKey, category, 3600);
    return category;
  }

  // Update category
  async updateCategory(categoryId, updateData) {
    // If updating parent category, validate it
    if (updateData.parentCategory) {
      const parent = await Category.findById(updateData.parentCategory);
      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }

      // Prevent circular reference
      if (parent._id.toString() === categoryId) {
        throw new ApiError(400, "Category cannot be its own parent");
      }

      updateData.level = parent.level + 1;
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

  
    await cache.delPattern('categories:*');
    await cache.set(`category:${category._id}`, category.toObject ? category.toObject() : category, 3600);

    return category;
  }

  // Delete category
  async deleteCategory(categoryId) {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    // Check if category has products
    const hasProducts = await category.hasProducts();
    if (hasProducts) {
      throw new ApiError(400, "Cannot delete category with existing products");
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: categoryId });
    if (subcategories.length > 0) {
      throw new ApiError(400, "Cannot delete category with subcategories");
    }

    await category.deleteOne();

  
    await cache.delPattern('categories:*');
    await cache.del(`category:${categoryId}`);

    return { message: "Category deleted successfully" };
  }

  // Get category tree (hierarchical structure)
  async getCategoryTree() {
    return await Category.getCategoryTree();
  }

  // Get categories with product counts
  async getCategoriesWithCounts() {
  
    const cacheKey = 'categories:counts';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .select("name displayName slug productCount icon image");

    await cache.set(cacheKey, categories, 600);
    return categories;
  }
}

module.exports = new CategoryService();
