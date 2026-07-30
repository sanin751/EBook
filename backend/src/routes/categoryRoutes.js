const express = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { createRules, updateRules, idRule } = require('../validations/categoryValidation');

const router = express.Router();

router.get('/', categoryController.list);
router.get('/:id', idRule, validate, categoryController.getById);

router.use(protect, restrictTo('admin'));
router.post('/', createRules, validate, categoryController.create);
router.put('/:id', updateRules, validate, categoryController.update);
router.delete('/:id', idRule, validate, categoryController.remove);

module.exports = router;
