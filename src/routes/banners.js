const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/db');

// Kiểm tra kết nối database
console.log('Checking database connection in banners.js');
db.get('SELECT sqlite_version()', (err, row) => {
  if (err) {
    console.error('Database connection error in banners.js:', err.message);
  } else {
    console.log('Database connected successfully in banners.js. SQLite version:', row['sqlite_version()']);
  }
});

// Tạo thư mục img nếu chưa tồn tại
const imgDir = path.join(__dirname, '../../public/img');
if (!fs.existsSync(imgDir)) {
  console.log(`Creating image directory: ${imgDir}`);
  fs.mkdirSync(imgDir, { recursive: true });
  console.log('Image directory created successfully');
} else {
  console.log(`Image directory already exists: ${imgDir}`);
}

// Cấu hình multer cho việc upload hình ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imgDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh: jpeg, jpg, png, gif, webp'));
  }
});

// Tạo bảng banners nếu chưa tồn tại
const createBannersTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      image TEXT,
      type TEXT NOT NULL,
      link TEXT,
      position INTEGER DEFAULT 0,
      category_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(query, (err) => {
    if (err) {
      console.error('Error creating banners table:', err.message);
    } else {
      console.log('Banners table created or already exists');
    }
  });
};

createBannersTable();

// Lấy tất cả banner
router.get('/', (req, res) => {
  console.log('GET /banners - Fetching all banners');
  const query = 'SELECT * FROM banners ORDER BY position ASC';
  
  db.all(query, [], (err, banners) => {
    if (err) {
      console.error('Error fetching banners:', err);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách banner' });
    }
    console.log(`GET /banners - Found ${banners ? banners.length : 0} banners`);
    res.json(banners || []);
  });
});

// Lấy banner theo loại
router.get('/type/:type', (req, res) => {
  const { type } = req.params;
  const query = 'SELECT * FROM banners WHERE type = ? ORDER BY position ASC';
  
  db.all(query, [type], (err, banners) => {
    if (err) {
      console.error('Error fetching banners by type:', err);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách banner theo loại' });
    }
    res.json(banners || []);
  });
});

// Lấy banner theo danh mục
router.get('/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const query = 'SELECT * FROM banners WHERE category_id = ? ORDER BY position ASC';
  
  db.all(query, [categoryId], (err, banners) => {
    if (err) {
      console.error('Error fetching banners by category:', err);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách banner theo danh mục' });
    }
    res.json(banners || []);
  });
});

// Lấy banner theo ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM banners WHERE id = ?';
  
  db.get(query, [id], (err, banner) => {
    if (err) {
      console.error('Error fetching banner by id:', err);
      return res.status(500).json({ error: 'Lỗi khi lấy thông tin banner' });
    }
    
    if (!banner) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }
    
    res.json(banner);
  });
});

// Thêm banner mới
router.post('/', upload.single('image'), (req, res) => {
  const { title, description, type, link, position, category_id } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Loại banner là bắt buộc' });
  }

  let image = null;
  if (req.file) {
    image = req.file.filename;
  } else {
    return res.status(400).json({ error: 'Hình ảnh là bắt buộc' });
  }

  const query = `
    INSERT INTO banners (title, description, image, type, link, position, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [title, description, image, type, link, position || 0, category_id], function(err) {
    if (err) {
      console.error('Error creating banner:', err);
      return res.status(500).json({ error: 'Lỗi khi tạo banner mới', message: err.message });
    }

    // Lấy banner vừa tạo
    db.get('SELECT * FROM banners WHERE id = ?', [this.lastID], (err, newBanner) => {
      if (err) {
        console.error('Error fetching new banner:', err);
        return res.status(500).json({ error: 'Lỗi khi lấy thông tin banner mới' });
      }
      res.status(201).json(newBanner);
    });
  });
});

// Cập nhật banner
router.put('/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, type, link, position, category_id } = req.body;
  
  // Kiểm tra banner tồn tại
  db.get('SELECT * FROM banners WHERE id = ?', [id], (err, existingBanner) => {
    if (err) {
      console.error('Error checking banner:', err);
      return res.status(500).json({ error: 'Lỗi khi kiểm tra banner' });
    }

    if (!existingBanner) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    let image = existingBanner.image;
    if (req.file) {
      // Xóa hình ảnh cũ nếu có
      if (existingBanner.image) {
        const oldImagePath = path.join(__dirname, '../../public/img', existingBanner.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = req.file.filename;
    }

    const query = `
      UPDATE banners 
      SET title = ?, description = ?, image = ?, type = ?, link = ?, position = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(query, [title, description, image, type, link, position, category_id, id], function(err) {
      if (err) {
        console.error('Error updating banner:', err);
        return res.status(500).json({ error: 'Lỗi khi cập nhật banner', message: err.message });
      }

      // Lấy banner đã cập nhật
      db.get('SELECT * FROM banners WHERE id = ?', [id], (err, updatedBanner) => {
        if (err) {
          console.error('Error fetching updated banner:', err);
          return res.status(500).json({ error: 'Lỗi khi lấy thông tin banner đã cập nhật' });
        }
        res.json(updatedBanner);
      });
    });
  });
});

// Xóa banner
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Lấy thông tin banner trước khi xóa
  db.get('SELECT * FROM banners WHERE id = ?', [id], (err, banner) => {
    if (err) {
      console.error('Error checking banner:', err);
      return res.status(500).json({ error: 'Lỗi khi kiểm tra banner' });
    }

    if (!banner) {
      return res.status(404).json({ error: 'Không tìm thấy banner' });
    }

    // Xóa file hình ảnh nếu có
    if (banner.image) {
      const imagePath = path.join(__dirname, '../../public/img', banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Xóa banner khỏi database
    db.run('DELETE FROM banners WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting banner:', err);
        return res.status(500).json({ error: 'Lỗi khi xóa banner' });
      }
      res.json({ message: 'Xóa banner thành công' });
    });
  });
});

// Tạo banner mẫu (chỉ dùng để test)
router.post('/sample', (req, res) => {
  console.log('POST /banners/sample - Creating sample banner');
  const { title, description, type, link, position, category_id } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Loại banner là bắt buộc' });
  }

  // Tạo tên file ảnh mẫu dựa trên loại
  const sampleImageName = `banner-sample-${type}-${Date.now()}.webp`;
  
  // Tạo ảnh mẫu bằng cách copy từ ảnh mẫu có sẵn hoặc tạo file mới
  const sampleImagePath = path.join(__dirname, '../../public/img', sampleImageName);
  
  try {
    // Tạo file ảnh mẫu trống
    fs.writeFileSync(sampleImagePath, 'Sample banner image');
    console.log(`Created sample image at ${sampleImagePath}`);
    
    // Lưu thông tin banner vào database
    const query = `
      INSERT INTO banners (title, description, image, type, link, position, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      title || `Banner mẫu ${type}`, 
      description || `Mô tả banner mẫu ${type}`, 
      sampleImageName, 
      type, 
      link || '', 
      position || 0, 
      category_id || null
    ], function(err) {
      if (err) {
        console.error('Error creating sample banner:', err);
        return res.status(500).json({ error: 'Lỗi khi tạo banner mẫu', message: err.message });
      }

      // Lấy banner vừa tạo
      db.get('SELECT * FROM banners WHERE id = ?', [this.lastID], (err, newBanner) => {
        if (err) {
          console.error('Error fetching new sample banner:', err);
          return res.status(500).json({ error: 'Lỗi khi lấy thông tin banner mẫu' });
        }
        console.log('Sample banner created successfully:', newBanner);
        res.status(201).json(newBanner);
      });
    });
  } catch (error) {
    console.error('Error creating sample banner image:', error);
    return res.status(500).json({ error: 'Lỗi khi tạo ảnh mẫu', message: error.message });
  }
});

module.exports = router; 