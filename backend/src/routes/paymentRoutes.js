const express = require('express');
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createIntentRules } = require('../validations/paymentValidation');

const router = express.Router();

// Note: the /webhook route is mounted separately in app.js with a raw body
// parser (required for Stripe signature verification) BEFORE the global
// express.json() middleware, so it is intentionally not defined here.

router.post('/create-intent', protect, createIntentRules, validate, paymentController.createIntent);

router.post('/esewa/initiate', protect, createIntentRules, validate, paymentController.initiateEsewa);
// eSewa redirects the customer's browser here directly (GET, no auth header available).
router.get('/esewa/success', paymentController.esewaSuccess);
router.get('/esewa/failure', paymentController.esewaFailure);

router.post('/cod', protect, createIntentRules, validate, paymentController.cod);

module.exports = router;
