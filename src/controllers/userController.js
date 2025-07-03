const { db } = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAll = (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getOne = (req, res) => {
  db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(row);
  });
};

exports.create = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Thiếu username hoặc password' });
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user'], function(err) {
    if (err) return res.status(400).json({ error: 'Username đã tồn tại' });
    res.json({ id: this.lastID, username, role: role || 'user' });
  });
};

exports.update = async (req, res) => {
  const { password, role } = req.body;
  let query = 'UPDATE users SET ';
  let params = [];
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    query += 'password = ?, ';
    params.push(hash);
  }
  if (role) {
    query += 'role = ?, ';
    params.push(role);
  }
  query = query.replace(/, $/, '');
  query += ' WHERE id = ?';
  params.push(req.params.id);
  db.run(query, params, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.remove = (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
}; 