const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function isLessThanPrice(value) {
          return value == null || value < this.price;
        },
        message: 'Discount price must be less than the regular price',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    // Display/spec fields used by the product detail and compare views.
    author: { type: String, trim: true },
    publisher: { type: String, trim: true },
    pages: { type: String, trim: true },
    isbn: { type: String, trim: true },
    formats: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('validate', function generateSlug() {
  if (this.isModified('name') || this.isNew) {
    const base = `${this.name}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${base}-${Date.now().toString(36)}`;
  }
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
