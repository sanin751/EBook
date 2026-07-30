function sendSuccess(res, { statusCode = 200, message = 'Success', data = undefined, meta = undefined } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {}),
  });
}

module.exports = { sendSuccess };
