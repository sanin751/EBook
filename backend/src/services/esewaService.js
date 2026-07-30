const crypto = require('crypto');
const env = require('../config/env');

const SIGNED_FIELDS = 'total_amount,transaction_uuid,product_code';

function formatAmount(amount) {
  return (Math.round(Number(amount) * 100) / 100).toFixed(2);
}

function buildSignature(fields, signedFieldNames) {
  const message = signedFieldNames
    .split(',')
    .map((field) => `${field}=${fields[field]}`)
    .join(',');
  return crypto.createHmac('sha256', env.esewa.secretKey).update(message).digest('base64');
}

function buildInitiationPayload({ totalAmount, transactionUuid }) {
  const amount = formatAmount(totalAmount);
  const fields = {
    amount,
    tax_amount: '0',
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: env.esewa.productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: `${env.serverUrl}/api/v1/payments/esewa/success`,
    failure_url: `${env.serverUrl}/api/v1/payments/esewa/failure`,
    signed_field_names: SIGNED_FIELDS,
  };
  fields.signature = buildSignature(fields, SIGNED_FIELDS);

  return { gatewayUrl: env.esewa.gatewayUrl, fields };
}

function decodeCallbackData(base64Data) {
  const json = Buffer.from(base64Data, 'base64').toString('utf-8');
  return JSON.parse(json);
}

function verifyCallbackSignature(payload) {
  if (!payload?.signed_field_names || !payload?.signature) return false;
  const expected = buildSignature(payload, payload.signed_field_names);
  return expected === payload.signature;
}

async function checkTransactionStatus({ totalAmount, transactionUuid }) {
  const url = new URL(env.esewa.statusUrl);
  url.searchParams.set('product_code', env.esewa.productCode);
  url.searchParams.set('total_amount', formatAmount(totalAmount));
  url.searchParams.set('transaction_uuid', transactionUuid);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`eSewa status check request failed with HTTP ${res.status}`);
  }
  return res.json();
}

module.exports = {
  formatAmount,
  buildInitiationPayload,
  decodeCallbackData,
  verifyCallbackSignature,
  checkTransactionStatus,
};
