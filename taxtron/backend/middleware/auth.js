const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/user');

const requireSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id && decoded.role !== 'user') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) throw new Error('Account not found');
      req.adminId = String(admin._id);
      req.role = 'admin';
    } else if (decoded.userId) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user?.isActive) throw new Error('Account unavailable');
      req.user = user;
      req.user.userId = String(user._id);
      req.role = 'user';
    } else throw new Error('Invalid session');
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
};
const adminAuth = [requireSession, (req, res, next) => req.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Administrator access required.' })];
const authenticateUser = [requireSession, (req, res, next) => req.role === 'user' ? next() : res.status(403).json({ success: false, message: 'Vehicle owner account required.' })];
module.exports = { adminAuth, authenticateUser, requireSession };
