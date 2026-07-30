const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { addRules, productIdParamRule, moveToCartRules } = require('../validations/wishlistValidation');

const router = express.Router();

router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/', addRules, validate, wishlistController.addProduct);
router.delete('/:productId', productIdParamRule, validate, wishlistController.removeProduct);
router.post('/:productId/move-to-cart', moveToCartRules, validate, wishlistController.moveToCart);

module.exports = router;
