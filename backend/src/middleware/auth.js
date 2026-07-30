const { verifyAccessToken } = require('../utils/token');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');

const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return next(ApiError.unauthorized('You are not logged in. Please log in to access this resource.'));
  }
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    return next(ApiError.unauthorized('The user belonging to this token no longer exists or is deactivated'));
  }
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(ApiError.unauthorized('Password was recently changed. Please log in again.'));
  }
  req.user = user;
  next();
});
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { protect, restrictTo };
