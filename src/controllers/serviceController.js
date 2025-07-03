const { db } = require('../config/db');

exports.getAll = (req, res) => {
  db.all('SELECT * FROM services', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getOne = (req, res) => {
  db.get('SELECT * FROM services WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    res.json(row);
  });
};

exports.create = (req, res) => {
  const { name, price, description } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Thiếu tên hoặc giá' });
  db.run('INSERT INTO services (name, price, description) VALUES (?, ?, ?)', [name, price, description || ''], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, name, price, description });
  });
};

exports.update = (req, res) => {
  const { name, price, description } = req.body;
  db.run('UPDATE services SET name = ?, price = ?, description = ? WHERE id = ?', [name, price, description, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.remove = (req, res) => {
  db.run('DELETE FROM services WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
}; 