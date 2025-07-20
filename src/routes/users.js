const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Tất cả routes đều cần authentication
router.use(auth);

// GET /api/users - Lấy danh sách tất cả users (chỉ admin)
router.get('/', isAdmin, getAllUsers);

// GET /api/users/:id - Lấy thông tin user theo ID (chỉ admin)
router.get('/:id', isAdmin, getUserById);

// POST /api/users - Tạo user mới (chỉ admin)
router.post('/', isAdmin, createUser);

// PUT /api/users/:id - Cập nhật user (chỉ admin)
router.put('/:id', isAdmin, updateUser);

// DELETE /api/users/:id - Xóa user (chỉ admin)
router.delete('/:id', isAdmin, deleteUser);

module.exports = router; 