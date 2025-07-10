const { db } = require('../config/db');

// Lấy nội dung trang tĩnh theo slug
exports.getPage = (req, res) => {
  const slug = req.params.slug;
  db.get('SELECT * FROM static_pages WHERE slug = ?', [slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
};

// Tạo mới trang tĩnh
exports.createPage = (req, res) => {
  const { slug, title, content } = req.body;
  db.run('INSERT INTO static_pages (slug, title, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [slug, title, content],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, slug, title, content });
    }
  );
};

// Cập nhật nội dung trang tĩnh
exports.updatePage = (req, res) => {
  const slug = req.params.slug;
  const { content } = req.body;
  db.run('UPDATE static_pages SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?',
    [content, slug],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
}; 