const express = require('express');
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadProductImages } = require('../config/multer');
const { createRules, updateRules, idRule, listRules, compareRules } = require('../validations/productValidation');

const router = express.Router();

router.get('/', listRules, validate, productController.list);
router.get('/compare', compareRules, validate, productController.compare);
router.get('/:id', idRule, validate, productController.getById);

router.use(protect, restrictTo('admin'));
router.post('/', uploadProductImages.array('images', 5), createRules, validate, productController.create);
router.put('/:id', uploadProductImages.array('images', 5), updateRules, validate, productController.update);
router.delete('/:id', idRule, validate, productController.remove);

module.exports = router;
