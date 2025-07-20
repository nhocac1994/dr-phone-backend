const { db } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      } 
    });
  });
};

exports.me = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Không tìm thấy token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    db.get('SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Người dùng không tồn tại' });
      }
      res.json(user);
    });
  } catch (error) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
}; 