const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const { db } = require('../config/db');

// Public routes
router.get('/', async (req, res) => {
  const query = `
    SELECT 
      c.*,
      json_group_array(
        CASE WHEN sc.id IS NOT NULL THEN
          json_object(
            'id', sc.id,
            'name', sc.name,
            'description', sc.description,
            'status', sc.status
          )
        ELSE
          NULL
        END
      ) as sub_categories
    FROM categories c
    LEFT JOIN sub_categories sc ON c.id = sc.category_id AND sc.status = 'active'
    WHERE c.status = 'active'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  try {
    db.all(query, [], (err, categories) => {
      if (err) {
        console.error('Error getting categories:', err.message);
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách danh mục' });
      }

      // Parse sub_categories JSON string và loại bỏ null values
      categories = categories.map(category => ({
        ...category,
        sub_categories: JSON.parse(category.sub_categories).filter(Boolean)
      }));

      res.json(categories);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Admin routes
router.post('/', auth, isAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
  }

  const query = `
    INSERT INTO categories (name, description, status, created_at, updated_at)
    VALUES (?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  try {
    db.run(query, [name, description], function(err) {
      if (err) {
        console.error('Error creating category:', err.message);
        return res.status(500).json({ error: 'Lỗi khi tạo danh mục' });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        description,
        status: 'active'
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const db = req.app.get('db');
    await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    res.json({ id, name });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lấy danh mục con theo category_id
router.get('/:categoryId/sub-categories', async (req, res) => {
  const { categoryId } = req.params;

  const query = `
    SELECT * FROM sub_categories
    WHERE category_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `;

  try {
    db.all(query, [categoryId], (err, subCategories) => {
      if (err) {
        console.error('Error getting sub-categories:', err.message);
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách danh mục con' });
      }
      res.json(subCategories);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Thêm danh mục con mới (yêu cầu đăng nhập admin)
router.post('/:categoryId/sub-categories', auth, async (req, res) => {
  const { categoryId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tên danh mục con là bắt buộc' });
  }

  const query = `
    INSERT INTO sub_categories (category_id, name, description)
    VALUES (?, ?, ?)
  `;

  try {
    db.run(query, [categoryId, name, description], function(err) {
      if (err) {
        console.error('Error creating sub-category:', err.message);
        return res.status(500).json({ error: 'Lỗi khi tạo danh mục con' });
      }
      res.status(201).json({
        id: this.lastID,
        category_id: categoryId,
        name,
        description,
        status: 'active'
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cập nhật danh mục con (yêu cầu đăng nhập admin)
router.put('/:categoryId/sub-categories/:id', auth, async (req, res) => {
  const { categoryId, id } = req.params;
  const { name, description, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tên danh mục con là bắt buộc' });
  }

  const query = `
    UPDATE sub_categories
    SET name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND category_id = ?
  `;

  try {
    db.run(query, [name, description, status || 'active', id, categoryId], function(err) {
      if (err) {
        console.error('Error updating sub-category:', err.message);
        return res.status(500).json({ error: 'Lỗi khi cập nhật danh mục con' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy danh mục con' });
      }
      res.json({
        id: parseInt(id),
        category_id: parseInt(categoryId),
        name,
        description,
        status: status || 'active'
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa danh mục con (soft delete) (yêu cầu đăng nhập admin)
router.delete('/:categoryId/sub-categories/:id', auth, async (req, res) => {
  const { categoryId, id } = req.params;

  const query = `
    UPDATE sub_categories
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND category_id = ?
  `;

  try {
    db.run(query, [id, categoryId], function(err) {
      if (err) {
        console.error('Error deleting sub-category:', err.message);
        return res.status(500).json({ error: 'Lỗi khi xóa danh mục con' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy danh mục con' });
      }
      res.json({ message: 'Xóa danh mục con thành công' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router; 