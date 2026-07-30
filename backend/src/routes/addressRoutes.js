const express = require('express');
const addressController = require('../controllers/addressController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createRules, updateRules, idRule } = require('../validations/addressValidation');

const router = express.Router();

router.use(protect);

router.get('/', addressController.list);
router.post('/', createRules, validate, addressController.create);
router.put('/:id', updateRules, validate, addressController.update);
router.delete('/:id', idRule, validate, addressController.remove);

module.exports = router;
