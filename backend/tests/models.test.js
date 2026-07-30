const { User, Category, Product, Cart, Order, Review, Payment, Address } = require('../src/models');

describe('User model', () => {
  it('hashes the password before saving and hides it from JSON', async () => {
    const user = await User.create({ name: 'Jane Doe', email: 'jane@example.com', password: 'Password123' });
    expect(user.password).not.toBe('Password123');

    const fetched = await User.findById(user._id).select('+password');
    const matches = await fetched.comparePassword('Password123');
    expect(matches).toBe(true);

    expect(user.toJSON().password).toBeUndefined();
  });

  it('rejects duplicate emails', async () => {
    await User.create({ name: 'A', email: 'dup@example.com', password: 'Password123' });
    await expect(User.create({ name: 'B', email: 'dup@example.com', password: 'Password123' })).rejects.toThrow();
  });
});

describe('Category model', () => {
  it('auto-generates a slug from the name', async () => {
    const category = await Category.create({ name: 'Fiction Books' });
    expect(category.slug).toBe('fiction-books');
  });
});

describe('Product model', () => {
  it('auto-generates a unique slug and exposes inStock virtual', async () => {
    const category = await Category.create({ name: 'Fiction' });
    const product = await Product.create({
      name: 'Tall Tale',
      description: 'A tall novel',
      price: 30,
      category: category._id,
      stock: 5,
    });
    expect(product.slug).toMatch(/^tall-tale-/);
    expect(product.toJSON().inStock).toBe(true);
  });

  it('rejects a discount price greater than or equal to the price', async () => {
    const category = await Category.create({ name: 'Sci-Fi & Fantasy' });
    await expect(
      Product.create({
        name: 'Short Story Collection',
        description: 'desc',
        price: 10,
        discountPrice: 12,
        category: category._id,
        stock: 1,
      })
    ).rejects.toThrow();
  });
});

describe('Cart model', () => {
  it('computes totalItems and totalPrice virtuals', async () => {
    const user = await User.create({ name: 'Cart User', email: 'cart@example.com', password: 'Password123' });
    const category = await Category.create({ name: 'Non-Fiction' });
    const product = await Product.create({
      name: 'Guidebook',
      description: 'desc',
      price: 20,
      category: category._id,
      stock: 10,
    });

    const cart = await Cart.create({
      user: user._id,
      items: [{ product: product._id, quantity: 3, price: product.price }],
    });

    expect(cart.totalItems).toBe(3);
    expect(cart.totalPrice).toBe(60);
  });
});

describe('Order model', () => {
  it('requires at least one item', async () => {
    const user = await User.create({ name: 'Order User', email: 'order@example.com', password: 'Password123' });
    await expect(
      Order.create({
        user: user._id,
        items: [],
        shippingAddress: {
          fullName: 'Order User',
          phone: '123',
          street: 'St',
          city: 'City',
          country: 'Country',
        },
        itemsTotal: 0,
        totalAmount: 0,
      })
    ).rejects.toThrow();
  });
});

describe('Review model', () => {
  it('recalculates product ratings after save and after delete', async () => {
    const user = await User.create({ name: 'Reviewer', email: 'reviewer@example.com', password: 'Password123' });
    const category = await Category.create({ name: 'Mystery & Thriller' });
    const product = await Product.create({
      name: 'Mystery Novel',
      description: 'desc',
      price: 15,
      category: category._id,
      stock: 5,
    });

    const review = await Review.create({ product: product._id, user: user._id, rating: 4 });

    let updated = await Product.findById(product._id);
    expect(updated.ratingsAverage).toBe(4);
    expect(updated.ratingsCount).toBe(1);

    await Review.findOneAndDelete({ _id: review._id });

    updated = await Product.findById(product._id);
    expect(updated.ratingsCount).toBe(0);
  });

  it('prevents duplicate reviews from the same user for the same product', async () => {
    const user = await User.create({ name: 'Reviewer2', email: 'reviewer2@example.com', password: 'Password123' });
    const category = await Category.create({ name: "Children's" });
    const product = await Product.create({
      name: 'Picture Book',
      description: 'desc',
      price: 15,
      category: category._id,
      stock: 5,
    });

    await Review.create({ product: product._id, user: user._id, rating: 5 });
    await expect(Review.create({ product: product._id, user: user._id, rating: 3 })).rejects.toThrow();
  });
});

describe('Payment and Address models', () => {
  it('creates a payment linked to an order', async () => {
    const user = await User.create({ name: 'Payer', email: 'payer@example.com', password: 'Password123' });
    const category = await Category.create({ name: 'Biography & Memoir' });
    const product = await Product.create({
      name: 'Memoir',
      description: 'desc',
      price: 10,
      category: category._id,
      stock: 5,
    });
    const order = await Order.create({
      user: user._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { fullName: 'Payer', phone: '123', street: 'St', city: 'City', country: 'Country' },
      itemsTotal: 10,
      totalAmount: 10,
    });

    const payment = await Payment.create({ order: order._id, user: user._id, amount: 10 });
    expect(payment.status).toBe('pending');
    expect(payment.provider).toBe('stripe');
  });

  it('creates an address for a user', async () => {
    const user = await User.create({ name: 'Addr User', email: 'addr@example.com', password: 'Password123' });
    const address = await Address.create({
      user: user._id,
      fullName: 'Addr User',
      phone: '123',
      street: 'St',
      city: 'City',
      country: 'Country',
    });
    expect(address.user.toString()).toBe(user._id.toString());
  });
});
