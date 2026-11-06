const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory bounded user session cache (TTL: 60s)
// Dramatically reduces redundant User.findByPk lookups on every button tap
const USER_CACHE_TTL_MS = 60 * 1000;
const userCache = new Map(); // userId -> { user, expiresAt }

function getCachedUser(userId) {
  const cached = userCache.get(userId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    userCache.delete(userId);
    return null;
  }
  return cached.user;
}

function setCachedUser(userId, user) {
  if (userCache.size > 2000) {
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}

function invalidateUserCache(userId) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check in-memory cache first to avoid database connection checkout
    let user = getCachedUser(decoded.id);
    if (!user) {
      user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      if (user) {
        setCachedUser(decoded.id, user);
      }
    }

    req.user = user;
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Not authorized, account deactivated' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = getCachedUser(decoded.id);
    if (!user) {
      user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      if (user) {
        setCachedUser(decoded.id, user);
      }
    }
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Continue unauthenticated if optional token is invalid
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

module.exports = { protect, optionalProtect, authorize, invalidateUserCache };
