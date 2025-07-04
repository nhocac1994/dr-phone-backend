const { db } = require('../config/db');

// Lấy danh sách dịch vụ
exports.getServices = (req, res) => {
  const query = `
    SELECT 
      s.*,
      c.name as category_name,
      sc.name as sub_category_name,
      (SELECT GROUP_CONCAT(sp.id || ',' || sp.name || ',' || sp.original_price || ',' || sp.discount_percent || ',' || sp.final_price)
       FROM spare_parts sp 
       WHERE sp.service_id = s.id AND sp.status = 'active'
      ) as spare_parts
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN sub_categories sc ON s.sub_category_id = sc.id
    WHERE s.status = 'active'
    ORDER BY s.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error getting services:', err.message);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách dịch vụ' });
    }

    // Xử lý dữ liệu trả về
    const services = rows.map(row => {
      const service = {
        ...row,
        images: row.images ? row.images.split(',') : [],
        spare_parts: []
      };

      // Xử lý spare_parts string thành array object
      if (row.spare_parts) {
        const parts = row.spare_parts.split(',');
        for (let i = 0; i < parts.length; i += 5) {
          service.spare_parts.push({
            id: parseInt(parts[i]),
            name: parts[i + 1],
            original_price: parseInt(parts[i + 2]),
            discount_percent: parseInt(parts[i + 3]),
            final_price: parseInt(parts[i + 4])
          });
        }
      }

      delete service.spare_parts_string;
      return service;
    });

    res.json(services);
  });
};

// Lấy chi tiết một dịch vụ
exports.getService = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      s.*,
      c.name as category_name,
      sc.name as sub_category_name
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN sub_categories sc ON s.sub_category_id = sc.id
    WHERE s.id = ? AND s.status = 'active'
  `;

  db.get(query, [id], (err, service) => {
    if (err) {
      console.error('Error getting service:', err.message);
      return res.status(500).json({ error: 'Lỗi khi lấy thông tin dịch vụ' });
    }

    if (!service) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }

    // Lấy danh sách linh kiện của dịch vụ
    const spareParts = `
      SELECT * FROM spare_parts
      WHERE service_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `;

    db.all(spareParts, [id], (err, parts) => {
      if (err) {
        console.error('Error getting spare parts:', err.message);
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách linh kiện' });
      }

      service.images = service.images ? service.images.split(',') : [];
      service.spare_parts = parts;

      res.json(service);
    });
  });
};

// Tạo dịch vụ mới
exports.createService = (req, res) => {
  const {
    category_id,
    sub_category_id,
    name,
    description,
    content,
    price,
    warranty,
    repair_time,
    promotion,
    vip_discount,
    student_discount,
    images,
    spare_parts
  } = req.body;

  if (!name || !category_id || !price) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const query = `
    INSERT INTO services (
      category_id, sub_category_id, name, description, content,
      price, warranty, repair_time, promotion,
      vip_discount, student_discount, images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    category_id,
    sub_category_id || null,
    name,
    description || null,
    content || null,
    price,
    warranty || null,
    repair_time || null,
    promotion || null,
    vip_discount || null,
    student_discount || null,
    images ? images.join(',') : null
  ];

  db.run(query, values, function(err) {
    if (err) {
      console.error('Error creating service:', err.message);
      return res.status(500).json({ error: 'Lỗi khi tạo dịch vụ' });
    }

    const serviceId = this.lastID;

    // Thêm các linh kiện
    if (spare_parts && spare_parts.length > 0) {
      const sparePartQuery = `
        INSERT INTO spare_parts (
          service_id, name, original_price,
          discount_percent, final_price,
          warranty, repair_time, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(sparePartQuery);
      
      spare_parts.forEach(part => {
        const finalPrice = part.original_price * (1 - (part.discount_percent || 0) / 100);
        stmt.run([
          serviceId,
          part.name,
          part.original_price,
          part.discount_percent || 0,
          Math.round(finalPrice),
          part.warranty || null,
          part.repair_time || null,
          part.description || null
        ], (err) => {
          if (err) {
            console.error('Error creating spare part:', err.message);
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing spare parts:', err.message);
          return res.status(500).json({ error: 'Lỗi khi tạo linh kiện' });
        }
        res.status(201).json({ id: serviceId, message: 'Tạo dịch vụ thành công' });
      });
    } else {
      res.status(201).json({ id: serviceId, message: 'Tạo dịch vụ thành công' });
    }
  });
};

// Cập nhật dịch vụ
exports.updateService = (req, res) => {
  const { id } = req.params;
  const {
    category_id,
    sub_category_id,
    name,
    description,
    content,
    price,
    warranty,
    repair_time,
    promotion,
    vip_discount,
    student_discount,
    images,
    spare_parts
  } = req.body;

  if (!name || !category_id || !price) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const query = `
    UPDATE services SET
      category_id = ?,
      sub_category_id = ?,
      name = ?,
      description = ?,
      content = ?,
      price = ?,
      warranty = ?,
      repair_time = ?,
      promotion = ?,
      vip_discount = ?,
      student_discount = ?,
      images = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    category_id,
    sub_category_id || null,
    name,
    description || null,
    content || null,
    price,
    warranty || null,
    repair_time || null,
    promotion || null,
    vip_discount || null,
    student_discount || null,
    images ? images.join(',') : null,
    id
  ];

  db.run(query, values, function(err) {
    if (err) {
      console.error('Error updating service:', err.message);
      return res.status(500).json({ error: 'Lỗi khi cập nhật dịch vụ' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }

    // Cập nhật linh kiện
    if (spare_parts && spare_parts.length > 0) {
      // Xóa các linh kiện cũ
      const deleteQuery = `
        UPDATE spare_parts
        SET status = 'deleted'
        WHERE service_id = ?
      `;

      db.run(deleteQuery, [id], (err) => {
        if (err) {
          console.error('Error deleting old spare parts:', err.message);
          return res.status(500).json({ error: 'Lỗi khi xóa linh kiện cũ' });
        }

        // Thêm linh kiện mới
        const sparePartQuery = `
          INSERT INTO spare_parts (
            service_id, name, original_price,
            discount_percent, final_price,
            warranty, repair_time, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const stmt = db.prepare(sparePartQuery);
        
        spare_parts.forEach(part => {
          const finalPrice = part.original_price * (1 - (part.discount_percent || 0) / 100);
          stmt.run([
            id,
            part.name,
            part.original_price,
            part.discount_percent || 0,
            Math.round(finalPrice),
            part.warranty || null,
            part.repair_time || null,
            part.description || null
          ], (err) => {
            if (err) {
              console.error('Error creating spare part:', err.message);
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('Error finalizing spare parts:', err.message);
            return res.status(500).json({ error: 'Lỗi khi tạo linh kiện' });
          }
          res.json({ id, message: 'Cập nhật dịch vụ thành công' });
        });
      });
    } else {
      res.json({ id, message: 'Cập nhật dịch vụ thành công' });
    }
  });
};

// Xóa dịch vụ
exports.deleteService = (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE services
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error deleting service:', err.message);
      return res.status(500).json({ error: 'Lỗi khi xóa dịch vụ' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }

    // Xóa các linh kiện
    const sparePartQuery = `
      UPDATE spare_parts
      SET status = 'deleted'
      WHERE service_id = ?
    `;

    db.run(sparePartQuery, [id], (err) => {
      if (err) {
        console.error('Error deleting spare parts:', err.message);
      }
    });

    res.json({ message: 'Xóa dịch vụ thành công' });
  });
}; 