const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

async function getTopSellingProducts(limit = 5) {
  return Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);
}

async function getDashboardSummary() {
  const [totalOrders, totalCustomers, totalProducts, revenueAgg, recentOrders, topSellingProducts] =
    await Promise.all([
      Order.countDocuments({}),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.find({}).sort('-createdAt').limit(5).populate('user', 'name email'),
      getTopSellingProducts(5),
    ]);

  return {
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenue: revenueAgg[0] ? revenueAgg[0].total : 0,
    recentOrders,
    topSellingProducts,
  };
}

async function getOrdersReport({ startDate, endDate, status }) {
  const match = {};
  if (status) match.status = status;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [orders, summaryAgg] = await Promise.all([
    Order.find(match).sort('-createdAt').populate('user', 'name email'),
    Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return {
    orders,
    summary: {
      totalOrders: summaryAgg[0] ? summaryAgg[0].totalOrders : 0,
      totalRevenue: summaryAgg[0] ? summaryAgg[0].totalRevenue : 0,
    },
  };
}

async function getProductsReport({ limit }) {
  return getTopSellingProducts(Number(limit) || 10);
}

module.exports = { getDashboardSummary, getOrdersReport, getProductsReport };
