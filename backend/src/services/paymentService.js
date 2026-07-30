const crypto = require('crypto');
const stripe = require('../config/stripe');
const env = require('../config/env');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const esewaService = require('./esewaService');

async function getPayableOrder(userId, orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.user.toString() !== userId.toString()) {
    throw ApiError.notFound('Order not found');
  }
  if (order.paymentStatus === 'paid') {
    throw ApiError.conflict('Order has already been paid');
  }
  return order;
}

async function upsertPayment(order, userId, { provider, providerPaymentId, method }) {
  let payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.provider = provider;
    payment.providerPaymentId = providerPaymentId;
    payment.amount = order.totalAmount;
    payment.status = 'pending';
    if (method) payment.method = method;
    await payment.save();
  } else {
    payment = await Payment.create({
      order: order._id,
      user: userId,
      amount: order.totalAmount,
      provider,
      providerPaymentId,
      method,
    });
  }

  if (!order.payment || order.payment.toString() !== payment._id.toString()) {
    order.payment = payment._id;
    await order.save();
  }

  return payment;
}

async function createPaymentIntent(userId, orderId) {
  const order = await getPayableOrder(userId, orderId);
  const amountInSmallestUnit = Math.round(order.totalAmount * 100);

  const intent = await stripe.paymentIntents.create({
    amount: amountInSmallestUnit,
    currency: 'npr',
    metadata: { orderId: order._id.toString(), userId: userId.toString() },
  });

  const payment = await upsertPayment(order, userId, { provider: 'stripe', providerPaymentId: intent.id });

  return { clientSecret: intent.client_secret, paymentId: payment._id };
}

async function handleWebhookEvent(rawBody, signature) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }

  const intent = event.data.object;

  if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const payment = await Payment.findOne({ providerPaymentId: intent.id });
    if (!payment) {
      logger.error(`Webhook received for unknown payment intent: ${intent.id}`);
      return;
    }

    const succeeded = event.type === 'payment_intent.succeeded';
    payment.status = succeeded ? 'succeeded' : 'failed';
    payment.method = intent.payment_method_types ? intent.payment_method_types[0] : payment.method;
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = succeeded ? 'paid' : 'failed';
      if (succeeded) order.status = 'processing';
      await order.save();
    }
  }
}

async function initiateEsewaPayment(userId, orderId) {
  const order = await getPayableOrder(userId, orderId);
  const transactionUuid = `${order._id.toString()}-${crypto.randomBytes(4).toString('hex')}`;

  await upsertPayment(order, userId, { provider: 'esewa', providerPaymentId: transactionUuid, method: 'esewa' });

  const { gatewayUrl, fields } = esewaService.buildInitiationPayload({
    totalAmount: order.totalAmount,
    transactionUuid,
  });

  return { gatewayUrl, fields };
}

async function completeEsewaPayment(base64Data) {
  let payload;
  try {
    payload = esewaService.decodeCallbackData(base64Data);
  } catch {
    throw ApiError.badRequest('Invalid eSewa callback payload');
  }

  if (!esewaService.verifyCallbackSignature(payload)) {
    throw ApiError.badRequest('eSewa callback signature verification failed');
  }

  const payment = await Payment.findOne({ provider: 'esewa', providerPaymentId: payload.transaction_uuid });
  if (!payment) {
    throw ApiError.notFound('No matching payment found for this eSewa transaction');
  }

  const status = await esewaService.checkTransactionStatus({
    totalAmount: payment.amount,
    transactionUuid: payload.transaction_uuid,
  });

  const succeeded = status.status === 'COMPLETE';
  payment.status = succeeded ? 'succeeded' : 'failed';
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = succeeded ? 'paid' : 'failed';
    if (succeeded) order.status = 'processing';
    await order.save();
  }

  return { orderId: payment.order.toString(), succeeded };
}

async function failEsewaPayment(base64Data) {
  let transactionUuid;
  try {
    transactionUuid = esewaService.decodeCallbackData(base64Data)?.transaction_uuid;
  } catch {
    transactionUuid = undefined;
  }

  let orderId;
  if (transactionUuid) {
    const payment = await Payment.findOne({ provider: 'esewa', providerPaymentId: transactionUuid });
    if (payment) {
      payment.status = 'failed';
      await payment.save();
      orderId = payment.order.toString();
    }
  }

  return { orderId };
}

async function payWithCod(userId, orderId) {
  const order = await getPayableOrder(userId, orderId);
  const payment = await upsertPayment(order, userId, { provider: 'cod', providerPaymentId: order._id.toString(), method: 'cod' });

  // No online gateway involved: the order can move straight to fulfillment,
  // cash is simply collected in person at delivery time.
  order.status = 'processing';
  await order.save();

  return { order, payment };
}

module.exports = {
  createPaymentIntent,
  handleWebhookEvent,
  initiateEsewaPayment,
  completeEsewaPayment,
  failEsewaPayment,
  payWithCod,
};
