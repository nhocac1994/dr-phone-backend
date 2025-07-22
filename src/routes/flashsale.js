const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// API tạo flash sale (lọc dịch vụ có linh kiện giảm >= 25%)
router.post('/', (req, res) => {
  const { start, end } = req.body;
  try {
    // Tạo flash sale mới
    const result = db.prepare('INSERT INTO flashsale (start, end) VALUES (?, ?)').run(start, end);
    const flashsaleId = result.lastInsertRowid;
    // Lấy tất cả dịch vụ có ít nhất 1 linh kiện giảm giá >= 25%
    const services = db.prepare('SELECT id, spare_parts FROM services').all();
    const eligibleServiceIds = [];
    for (const s of services) {
      let parts = [];
      try { parts = s.spare_parts ? JSON.parse(s.spare_parts) : []; } catch {}
      if (parts.some(p => Number(p.discount_percent) >= 25)) {
        eligibleServiceIds.push(s.id);
      }
    }
    // Lưu vào bảng flashsale_services
    const stmt = db.prepare('INSERT INTO flashsale_services (flashsale_id, service_id) VALUES (?, ?)');
    for (const serviceId of eligibleServiceIds) {
      stmt.run(flashsaleId, serviceId);
    }
    res.json({ success: true, flashsaleId, serviceIds: eligibleServiceIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API lấy flash sale hiện tại và dịch vụ thuộc flash sale
router.get('/current', (req, res) => {
  try {
    const now = new Date().toISOString();
    const flashsale = db.prepare('SELECT * FROM flashsale WHERE start <= ? AND end >= ? ORDER BY start DESC LIMIT 1').get(now, now);
    if (!flashsale) return res.json({ flashsale: null, services: [] });
    // Lấy danh sách dịch vụ thuộc flash sale này
    const serviceIdsResult = db.prepare('SELECT service_id FROM flashsale_services WHERE flashsale_id = ?').all(flashsale.id);
    const serviceIds = Array.isArray(serviceIdsResult) ? serviceIdsResult.map(r => r.service_id) : [];
    if (serviceIds.length === 0) return res.json({ flashsale, services: [] });
    // Lấy chi tiết dịch vụ
    const placeholders = serviceIds.map(() => '?').join(',');
    const services = db.prepare(`SELECT * FROM services WHERE id IN (${placeholders})`).all(...serviceIds);
    // Parse spare_parts
    const parsedServices = services.map(service => ({
      ...service,
      spare_parts: service.spare_parts ? JSON.parse(service.spare_parts) : []
    }));
    res.json({ flashsale, services: parsedServices });
  } catch (error) {
    console.error('Lỗi khi lấy flash sale:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router; 