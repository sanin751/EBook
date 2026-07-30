const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const env = require('../config/env');
const logger = require('../utils/logger');
const paymentService = require('../services/paymentService');

const createIntent = catchAsync(async (req, res) => {
  const result = await paymentService.createPaymentIntent(req.user._id, req.body.orderId);
  sendSuccess(res, { message: 'Payment intent created', data: result });
});

const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  await paymentService.handleWebhookEvent(req.body, signature);
  res.status(200).json({ received: true });
});

const initiateEsewa = catchAsync(async (req, res) => {
  const result = await paymentService.initiateEsewaPayment(req.user._id, req.body.orderId);
  sendSuccess(res, { message: 'eSewa payment initiated', data: result });
});

const esewaSuccess = catchAsync(async (req, res) => {
  try {
    const { orderId, succeeded } = await paymentService.completeEsewaPayment(req.query.data);
    res.redirect(`${env.clientUrl}/checkout/confirmation/${orderId}?payment=${succeeded ? 'success' : 'failed'}`);
  } catch (err) {
    logger.error('eSewa success callback failed:', err);
    res.redirect(`${env.clientUrl}/checkout/payment?payment=error`);
  }
});

const esewaFailure = catchAsync(async (req, res) => {
  const { orderId } = await paymentService.failEsewaPayment(req.query.data);
  const redirectPath = orderId ? `/checkout/confirmation/${orderId}?payment=failed` : '/checkout/payment?payment=failed';
  res.redirect(`${env.clientUrl}${redirectPath}`);
});

const cod = catchAsync(async (req, res) => {
  const { order } = await paymentService.payWithCod(req.user._id, req.body.orderId);
  sendSuccess(res, { message: 'Order placed for cash on delivery', data: { order } });
});

module.exports = { createIntent, webhook, initiateEsewa, esewaSuccess, esewaFailure, cod };
