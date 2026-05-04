const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const authorizeSchool = async (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return next();
  }
  const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
  if (schoolId && parseInt(schoolId) !== req.user.schoolId) {
    return res.status(403).json({ error: 'Cross-school access denied' });
  }
  next();
};

module.exports = { authenticateToken, authorizeRole, authorizeSchool };
