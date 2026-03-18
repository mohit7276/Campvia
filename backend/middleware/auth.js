const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// In-process user cache — avoids 3 DB lookups on every authenticated request.
// TTL: 60 seconds. Eviction runs every 2 minutes.
const userCache = new Map(); // userId -> { user, ts }
const USER_CACHE_TTL = 60_000;

async function findUserById(userId) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.ts < USER_CACHE_TTL) {
    return cached.user;
  }
  // Sequential fallback: student first (majority of users), then faculty, then admin
  let user = await Student.findById(userId).select('-password').lean();
  if (!user) user = await Faculty.findById(userId).select('-password').lean();
  if (!user) user = await Admin.findById(userId).select('-password').lean();
  if (user) userCache.set(userId, { user, ts: Date.now() });
  return user;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userCache.entries()) {
    if (now - val.ts >= USER_CACHE_TTL) userCache.delete(key);
  }
}, 120_000);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { auth, adminOnly };
