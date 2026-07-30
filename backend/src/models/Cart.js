const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Cosmetic selections captured from the product detail page (format,
    // edition label, custom gift message). These don't affect stock or
    // pricing, they're just carried through to the order as a record of
    // what the customer chose.
    selectedFormat: { type: String, trim: true },
    variantLabel: { type: String, trim: true },
    giftMessage: { type: String, trim: true, maxlength: [200, 'Gift message cannot exceed 200 characters'] },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.virtual('totalItems').get(function totalItems() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('totalPrice').get(function totalPrice() {
  return Math.round(this.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
