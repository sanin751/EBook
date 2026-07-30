const Stripe = require('stripe');
const env = require('./env');

const stripe = new Stripe(env.stripe.secretKey || 'sk_test_placeholder_key_replace_in_env');

module.exports = stripe;
