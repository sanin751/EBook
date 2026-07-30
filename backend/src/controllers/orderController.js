const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const orderService = require('../services/orderService');
const securityEventService = require('../services/securityEventService');

const create = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body.shippingAddress);
  sendSuccess(res, { statusCode: 201, message: 'Order created', data: { order } });
});

const list = catchAsync(async (req, res) => {
  const orders = await orderService.listOrders(req.user._id);
  sendSuccess(res, { data: { orders } });
});

const getById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.user._id, req.params.id, req.user.role === 'admin');
  sendSuccess(res, { data: { order } });
});

const adminList = catchAsync(async (req, res) => {
  const orders = await orderService.listAllOrders();
  sendSuccess(res, { data: { orders } });
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  await securityEventService.record({
    type: 'admin_order_status_updated',
    user: req.user._id,
    email: req.user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    meta: { orderId: order._id, status: order.status },
  });
  sendSuccess(res, { message: 'Order status updated', data: { order } });
});

module.exports = { create, list, getById, adminList, updateStatus };
