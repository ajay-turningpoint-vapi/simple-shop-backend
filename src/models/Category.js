const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    displayName: {
      type: String,
      required: [true, 'Please provide display name'],
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String, // Category image URL
    },
    icon: {
      type: String, // Icon name or URL
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // For subcategories
    },
    level: {
      type: Number,
      default: 0, // 0 = top level, 1 = subcategory, etc.
    },
    order: {
      type: Number,
      default: 0, // For sorting display order
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    meta :{
      type: Map,
      of: String, // For additional data like SEO, filters, etc.
    },
    productCount: {
      type: Number,
      default: 0, // Track number of products in this category
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1, order: 1 });

// Pre-save hook to generate slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
});

// Method to check if category has products
categorySchema.methods.hasProducts = async function () {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  return count > 0;
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function () {
  const categories = await this.find({ isActive: true })
    .sort({ order: 1 })
    .populate('subcategories');
  
  // Build tree structure
  const tree = categories.filter(cat => !cat.parentCategory);
  return tree;
};



module.exports = mongoose.model('Category', categorySchema);
