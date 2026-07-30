const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const securityEventService = require('../services/securityEventService');
const blockedIpService = require('../services/blockedIpService');

const listEvents = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { events, meta } = await securityEventService.list({ page, limit });
  sendSuccess(res, { data: { events }, meta });
});

const listBlockedIps = catchAsync(async (req, res) => {
  const blockedIps = await blockedIpService.listBlocked();
  sendSuccess(res, { data: { blockedIps } });
});

const blockIp = catchAsync(async (req, res) => {
  await blockedIpService.blockIp(req.body.ip, req.body.reason || 'Manually blocked by admin', {
    createdBy: req.user._id,
  });
  sendSuccess(res, { statusCode: 201, message: 'IP blocked' });
});

const unblockIp = catchAsync(async (req, res) => {
  await blockedIpService.unblockIp(req.params.ip);
  sendSuccess(res, { message: 'IP unblocked' });
});

module.exports = { listEvents, listBlockedIps, blockIp, unblockIp };
