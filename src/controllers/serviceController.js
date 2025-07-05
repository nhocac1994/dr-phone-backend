const { db } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục upload tồn tại
const uploadDir = path.join(__dirname, '../../public/img');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file ngẫu nhiên để tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = uniqueSuffix + ext;
    console.log('Saving file with name:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Kiểm tra file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
}).array('images', 5); // Tối đa 5 ảnh

// Lấy danh sách dịch vụ
exports.getServices = (req, res) => {
  const query = `
    SELECT 
      s.*,
      c.name as category_name,
      sc.name as sub_category_name,
      (SELECT GROUP_CONCAT(sp.id || ',' || sp.name || ',' || sp.original_price || ',' || 
                         sp.discount_percent || ',' || sp.final_price || ',' || 
                         COALESCE(sp.warranty, '') || ',' || 
                         COALESCE(sp.repair_time, '') || ',' || 
                         COALESCE(sp.description, ''))
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
        for (let i = 0; i < parts.length; i += 8) {
          if (i + 7 < parts.length) {
            service.spare_parts.push({
              id: parseInt(parts[i]),
              name: parts[i + 1],
              original_price: parseInt(parts[i + 2]),
              discount_percent: parseInt(parts[i + 3]),
              final_price: parseInt(parts[i + 4]),
              warranty: parts[i + 5],
              repair_time: parts[i + 6],
              description: parts[i + 7]
            });
          }
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
  console.log('Creating service...');
  console.log('Upload directory exists:', fs.existsSync(uploadDir));
  console.log('Upload directory permissions:', fs.statSync(uploadDir).mode.toString(8));
  
  // Xử lý upload file
  upload(req, res, async function(err) {
    console.log('Upload callback triggered');
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'Lỗi upload file: ' + err.message });
    } else if (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
    
    try {
      console.log('Request body:', req.body);
      console.log('Files:', req.files);
      
      // Nếu không có files, kiểm tra xem có phải multipart form không
      if (!req.files || req.files.length === 0) {
        console.log('No files detected. Content-Type:', req.headers['content-type']);
        if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
          return res.status(400).json({ error: 'Yêu cầu phải là multipart/form-data' });
        }
      }

      const {
        category_id,
        sub_category_id,
        name,
        content,
        promotion,
        vip_discount,
        student_discount,
        spare_parts,
        oldImages
      } = req.body;

      if (!name || !category_id) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Xử lý spare parts nếu là string
      let parsedSpareParts = [];
      if (spare_parts) {
        try {
          parsedSpareParts = typeof spare_parts === 'string' ? JSON.parse(spare_parts) : spare_parts;
        } catch (e) {
          console.error('Error parsing spare parts:', e);
        }
      }

      // Lấy tên file ảnh đã upload
      const imageNames = req.files ? req.files.map(file => file.filename) : [];
      console.log('Image names to save:', imageNames);

      // Tạo service mới
      const query = `
        INSERT INTO services (
          category_id, sub_category_id, name, content,
          promotion, vip_discount, student_discount, 
          images, price, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
      `;

      const values = [
        category_id,
        sub_category_id || null,
        name,
        content || null,
        promotion || null,
        vip_discount || null,
        student_discount || null,
        imageNames.length > 0 ? imageNames.join(',') : null
      ];

      console.log('SQL values:', values);

      // Thực hiện insert
      db.run(query, values, function(err) {
        if (err) {
          console.error('Error creating service:', err);
          // Xóa các file đã upload nếu lưu database thất bại
          imageNames.forEach(filename => {
            try {
              const filePath = path.join(uploadDir, filename);
              fs.unlinkSync(filePath);
            } catch (unlinkErr) {
              console.error('Error deleting file:', unlinkErr);
            }
          });
          return res.status(500).json({ error: 'Lỗi khi tạo dịch vụ: ' + err.message });
        }

        const serviceId = this.lastID;
        console.log('Created service ID:', serviceId);

        // Trả về response nếu không có spare parts
        if (!parsedSpareParts || parsedSpareParts.length === 0) {
          return res.json({
            message: 'Tạo dịch vụ thành công',
            id: serviceId,
            images: imageNames
          });
        }

        // Thêm spare parts
        let completed = 0;
        let hasError = false;

        const sparePartQuery = `
          INSERT INTO spare_parts (
            service_id, name, original_price,
            discount_percent, warranty, repair_time,
            description, final_price, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;

        parsedSpareParts.forEach(part => {
          const finalPrice = part.original_price * (1 - (part.discount_percent || 0) / 100);
          const sparePartValues = [
            serviceId,
            part.name,
            part.original_price,
            part.discount_percent || 0,
            part.warranty || null,
            part.repair_time || null,
            part.description || null,
            finalPrice
          ];

          db.run(sparePartQuery, sparePartValues, (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error('Error inserting spare part:', err);
            }
            completed++;

            if (completed === parsedSpareParts.length) {
              // Trả về response sau khi xử lý xong tất cả spare parts
              res.json({
                message: 'Tạo dịch vụ thành công',
                id: serviceId,
                images: imageNames
              });
            }
          });
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Lỗi server không xác định: ' + error.message });
    }
  });
};

// Cập nhật dịch vụ
exports.updateService = (req, res) => {
  console.log('Updating service...');
  console.log('Upload directory exists:', fs.existsSync(uploadDir));
  
  upload(req, res, function(err) {
    console.log('Update upload callback triggered');
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'Lỗi upload file: ' + err.message });
    } else if (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
    
    try {
      const { id } = req.params;
      console.log('Updating service ID:', id);
      console.log('Files:', req.files);
      console.log('Request body:', req.body);
      
      const {
        category_id,
        sub_category_id,
        name,
        content,
        promotion,
        vip_discount,
        student_discount,
        spare_parts,
        oldImages
      } = req.body;

      if (!name || !category_id) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Lấy thông tin dịch vụ hiện tại
      db.get('SELECT * FROM services WHERE id = ? AND status = "active"', [id], (err, service) => {
        if (err) {
          console.error('Error getting service:', err);
          return res.status(500).json({ error: 'Lỗi khi lấy thông tin dịch vụ' });
        }

        if (!service) {
          return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
        }

        // Xử lý hình ảnh
        let imageNames = [];
        
        // Giữ lại hình ảnh cũ nếu có
        let oldImagesArray = [];
        if (oldImages) {
          try {
            oldImagesArray = typeof oldImages === 'string' ? JSON.parse(oldImages) : oldImages;
            console.log('Old images to keep:', oldImagesArray);
          } catch (e) {
            console.error('Error parsing oldImages:', e);
          }
        }

        // Thêm hình ảnh mới nếu có
        if (req.files && req.files.length > 0) {
          const newImages = req.files.map(file => file.filename);
          console.log('New images to add:', newImages);
          imageNames = [...oldImagesArray, ...newImages];
        } else {
          imageNames = oldImagesArray;
        }

        console.log('Final images to save:', imageNames);

        // Xử lý spare parts
        let parsedSpareParts = [];
        if (spare_parts) {
          try {
            parsedSpareParts = typeof spare_parts === 'string' ? JSON.parse(spare_parts) : spare_parts;
            console.log('Spare parts:', parsedSpareParts);
          } catch (e) {
            console.error('Error parsing spare parts:', e);
          }
        }

        // Cập nhật dịch vụ
        const query = `
          UPDATE services SET
            category_id = ?,
            sub_category_id = ?,
            name = ?,
            content = ?,
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
          content || null,
          promotion || null,
          vip_discount || null,
          student_discount || null,
          imageNames.length > 0 ? imageNames.join(',') : null,
          id
        ];

        console.log('Update SQL values:', values);

        db.run(query, values, function(err) {
          if (err) {
            console.error('Error updating service:', err);
            // Xóa các file đã upload nếu lưu database thất bại
            if (req.files) {
              req.files.forEach(file => {
                try {
                  fs.unlinkSync(file.path);
                } catch (unlinkErr) {
                  console.error('Error deleting file:', unlinkErr);
                }
              });
            }
            return res.status(500).json({ error: 'Lỗi khi cập nhật dịch vụ' });
          }

          // Cập nhật linh kiện
          if (parsedSpareParts && parsedSpareParts.length > 0) {
            // Xóa các linh kiện cũ
            db.run('UPDATE spare_parts SET status = "deleted" WHERE service_id = ?', [id], (err) => {
              if (err) {
                console.error('Error deleting old spare parts:', err);
                return res.status(500).json({ error: 'Lỗi khi cập nhật linh kiện' });
              }

              // Thêm linh kiện mới
              let completed = 0;
              let hasError = false;

              const sparePartQuery = `
                INSERT INTO spare_parts (
                  service_id, name, original_price,
                  discount_percent, warranty, repair_time,
                  description, final_price, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
              `;

              parsedSpareParts.forEach(part => {
                const finalPrice = part.original_price * (1 - (part.discount_percent || 0) / 100);
                const sparePartValues = [
                  id,
                  part.name,
                  part.original_price,
                  part.discount_percent || 0,
                  part.warranty || null,
                  part.repair_time || null,
                  part.description || null,
                  finalPrice
                ];

                db.run(sparePartQuery, sparePartValues, (err) => {
                  if (err && !hasError) {
                    hasError = true;
                    console.error('Error inserting spare part:', err);
                  }
                  completed++;

                  if (completed === parsedSpareParts.length) {
                    // Trả về response sau khi xử lý xong tất cả spare parts
                    res.json({
                      message: 'Cập nhật dịch vụ thành công',
                      id: id,
                      images: imageNames
                    });
                  }
                });
              });
            });
          } else {
            // Trả về response ngay nếu không có spare parts
            res.json({
              message: 'Cập nhật dịch vụ thành công',
              id: id,
              images: imageNames
            });
          }
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Lỗi server không xác định: ' + error.message });
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