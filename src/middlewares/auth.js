const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Thiếu token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token không hợp lệ' });
    req.user = user;
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ admin được phép' });
  next();
}; 