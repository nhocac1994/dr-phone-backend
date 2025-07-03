const { db } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
}; 