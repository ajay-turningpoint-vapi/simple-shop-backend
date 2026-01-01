const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // MRP (original price before discount)
  mrp: {
    type: Number,
    required: [true, 'Please provide MRP'],
    min: [0, 'MRP cannot be negative']
  },

  // Effective selling price after discount (optional, can be derived)
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },

  // Discount in percentage (e.g. 51 for 51%)
  discountPercent: {
    type: Number,
    min: [0, 'Discount percent cannot be negative'],
    max: [100, 'Discount percent cannot be more than 100'],
    default: 0
  },

  category: {
    type: String,
    required: [true, 'Please provide product category'],
    enum: {
      values: ['electronics', 'clothing', 'food', 'books', 'toys', 'sports', 'home', 'beauty', 'automotive', 'other'],
      message: 'Please select a valid category'
    }
  },
  brand: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],

  // Color Variants with Individual Stock
  variants: [{
    color: {
      type: String,
      required: true,
      trim: true
    },
    colorCode: {
      type: String,  // Hex code like #FF6B35
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    images: [{
      type: String
    }],
    sku: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],

  specifications: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ user: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.color': 1 });

// Virtual: total stock across all variants
productSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) {
    return 0;
  }
  return this.variants.reduce((total, variant) => total + variant.stock, 0);
});

// Virtual: available colors count
productSchema.virtual('availableColorsCount').get(function() {
  if (!this.variants || this.variants.length === 0) {
    return 0;
  }
  return this.variants.filter(v => v.isAvailable && v.stock > 0).length;
});

// Virtual: auto-calc discount price from mrp & discountPercent
productSchema.virtual('calculatedDiscountPrice').get(function() {
  if (typeof this.mrp !== 'number' || typeof this.discountPercent !== 'number') {
    return this.price;
  }
  const discountAmount = (this.mrp * this.discountPercent) / 100;
  const finalPrice = this.mrp - discountAmount;
  return Math.round(finalPrice); // or keep decimals if you prefer
});

// Method to get stock status for a variant
productSchema.methods.getVariantStockStatus = function(color) {
  const variant = this.variants.find(
    v => v.color.toLowerCase() === color.toLowerCase()
  );
  if (!variant || variant.stock === 0) return 'Out of Stock';
  if (variant.stock < 5) return 'Low Stock';
  return 'In Stock';
};

module.exports = mongoose.model('Product', productSchema);
