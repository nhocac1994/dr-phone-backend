const { db } = require('../config/db');

exports.getAll = (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getMine = (req, res) => {
  db.all('SELECT * FROM orders WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.create = (req, res) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ error: 'Thiếu service_id' });
  db.run('INSERT INTO orders (user_id, service_id) VALUES (?, ?)', [req.user.id, service_id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, user_id: req.user.id, service_id });
  });
};

exports.update = (req, res) => {
  const { status } = req.body;
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.remove = (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
}; 