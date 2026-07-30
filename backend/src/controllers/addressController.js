const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const addressService = require('../services/addressService');

const list = catchAsync(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user._id);
  sendSuccess(res, { data: { addresses } });
});

const create = catchAsync(async (req, res) => {
  const address = await addressService.createAddress(req.user._id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Address added', data: { address } });
});

const update = catchAsync(async (req, res) => {
  const address = await addressService.updateAddress(req.user._id, req.params.id, req.body);
  sendSuccess(res, { message: 'Address updated', data: { address } });
});

const remove = catchAsync(async (req, res) => {
  await addressService.deleteAddress(req.user._id, req.params.id);
  sendSuccess(res, { message: 'Address removed' });
});

module.exports = { list, create, update, remove };
