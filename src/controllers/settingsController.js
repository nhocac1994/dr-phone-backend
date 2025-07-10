const { db } = require('../config/db');

// Lấy thông tin settings
exports.getSettings = (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({});
    // Parse certificates (JSON string)
    if (row.certificates) {
      try { row.certificates = JSON.parse(row.certificates); } catch {}
    } else {
      row.certificates = [];
    }
    res.json(row);
  });
};

// Cập nhật settings
exports.updateSettings = (req, res) => {
  const data = req.body;
  const certificates = JSON.stringify(data.certificates || []);
  db.run(`INSERT INTO settings (id, company_name, phone, phone_feedback, address, email, facebook, youtube, zalo, tiktok, messenger, instagram, certificates, updated_at)
    VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      company_name=excluded.company_name,
      phone=excluded.phone,
      phone_feedback=excluded.phone_feedback,
      address=excluded.address,
      email=excluded.email,
      facebook=excluded.facebook,
      youtube=excluded.youtube,
      zalo=excluded.zalo,
      tiktok=excluded.tiktok,
      messenger=excluded.messenger,
      instagram=excluded.instagram,
      certificates=excluded.certificates,
      updated_at=CURRENT_TIMESTAMP
  `,
    [data.company_name, data.phone, data.phone_feedback, data.address, data.email, data.facebook, data.youtube, data.zalo, data.tiktok, data.messenger, data.instagram, certificates],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
}; 