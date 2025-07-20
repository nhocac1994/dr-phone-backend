const db = require('../config/db').db;

// Lấy thông tin settings
exports.getSettings = (req, res) => {
  console.log('Getting settings...');
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
    if (err) {
      console.error('Error getting settings:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      console.log('No settings found, returning empty object');
      return res.json({});
    }
    console.log('Settings found:', row);
    // Parse certificates (JSON string)
    if (row.certificates) {
      try { 
        row.certificates = JSON.parse(row.certificates); 
        console.log('Parsed certificates:', row.certificates);
      } catch (e) {
        console.error('Error parsing certificates:', e);
      }
    } else {
      row.certificates = [];
    }
    res.json(row);
  });
};

// Cập nhật settings
exports.updateSettings = (req, res) => {
  console.log('Updating settings with data:', req.body);
  const data = req.body;
  const certificates = JSON.stringify(data.certificates || []);
  console.log('Certificates to save:', certificates);

  // Kiểm tra xem bảng settings đã tồn tại chưa
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'", [], (err, table) => {
    if (err) {
      console.error('Error checking settings table:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!table) {
      console.log('Settings table does not exist, creating...');
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        company_name TEXT,
        phone TEXT,
        phone_feedback TEXT,
        address TEXT,
        email TEXT,
        facebook TEXT,
        youtube TEXT,
        zalo TEXT,
        tiktok TEXT,
        messenger TEXT,
        instagram TEXT,
        certificates TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating settings table:', err);
          return res.status(500).json({ error: err.message });
        }
        performUpdate();
      });
    } else {
      performUpdate();
    }
  });

  function performUpdate() {
    const query = `INSERT OR REPLACE INTO settings (
      id, company_name, phone, phone_feedback, address, email, 
      facebook, youtube, zalo, tiktok, messenger, instagram, 
      certificates, updated_at
    ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`;

    const values = [
      data.company_name, data.phone, data.phone_feedback, data.address, data.email,
      data.facebook, data.youtube, data.zalo, data.tiktok, data.messenger, data.instagram,
      certificates
    ];

    console.log('Executing query with values:', values);

    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating settings:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Settings updated successfully');
      res.json({ success: true });
    });
  }
}; 