const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/ApiResponse');
const reportService = require('../services/reportService');

const dashboard = catchAsync(async (req, res) => {
  const summary = await reportService.getDashboardSummary();
  sendSuccess(res, { data: summary });
});

const ordersReport = catchAsync(async (req, res) => {
  const { orders, summary } = await reportService.getOrdersReport(req.query);
  sendSuccess(res, { data: { orders }, meta: summary });
});

const productsReport = catchAsync(async (req, res) => {
  const products = await reportService.getProductsReport(req.query);
  sendSuccess(res, { data: { products } });
});

module.exports = { dashboard, ordersReport, productsReport };
