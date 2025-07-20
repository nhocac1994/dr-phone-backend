const { db } = require('../config/db');
const bcrypt = require('bcryptjs');

// Lấy danh sách tất cả users (chỉ admin)
const getAllUsers = async (req, res) => {
  try {
    const sql = `
      SELECT id, username, email, role, is_active, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi khi tải danh sách người dùng' 
        });
      }
      
      res.json(rows || []);
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền: chỉ admin hoặc chính user đó mới được xem
    if (req.user.role !== 'admin' && parseInt(id) !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không có quyền truy cập' 
      });
    }
    
    const sql = `
      SELECT id, username, email, role, is_active, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi khi tải thông tin người dùng' 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy người dùng' 
        });
      }
      
      res.json(row);
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// Tạo user mới (chỉ admin)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user', is_active = true } = req.body;
    
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ admin mới có quyền tạo người dùng' 
      });
    }
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }
    
    // Kiểm tra username đã tồn tại
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error('Error checking username:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi server' 
        });
      }
      
      if (row) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username đã tồn tại' 
        });
      }
      
      // Kiểm tra email đã tồn tại
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error('Error checking email:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server' 
          });
        }
        
        if (row) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email đã tồn tại' 
          });
        }
        
        // Hash password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Lỗi server' 
            });
          }
          
          // Tạo user
          const sql = `
            INSERT INTO users (username, email, password, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `;
          
          db.run(sql, [username, email, hashedPassword, role, is_active], function(err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi tạo người dùng' 
              });
            }
            
            // Lấy thông tin user vừa tạo
            db.get('SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?', 
              [this.lastID], (err, row) => {
                if (err) {
                  console.error('Error fetching created user:', err);
                  return res.status(500).json({ 
                    success: false, 
                    message: 'Lỗi server' 
                  });
                }
                
                res.status(201).json({
                  success: true,
                  message: 'Tạo người dùng thành công',
                  data: row
                });
              });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// Cập nhật user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, current_password, new_password, role, is_active } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền: chỉ admin hoặc chính user đó mới được cập nhật
    if (req.user.role !== 'admin' && parseInt(id) !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không có quyền cập nhật' 
      });
    }
    
    // Nếu không phải admin, không cho phép thay đổi role và is_active
    if (req.user.role !== 'admin') {
      if (role !== undefined || is_active !== undefined) {
        return res.status(403).json({ 
          success: false, 
          message: 'Không có quyền thay đổi vai trò hoặc trạng thái' 
        });
      }
    }
    
    // Lấy thông tin user hiện tại
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi server' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy người dùng' 
        });
      }
      
      // Kiểm tra username đã tồn tại (nếu thay đổi)
      if (username && username !== user.username) {
        db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id], (err, row) => {
          if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Lỗi server' 
            });
          }
          
          if (row) {
            return res.status(400).json({ 
              success: false, 
              message: 'Username đã tồn tại' 
            });
          }
          
          // Tiếp tục với email check
          checkEmailAndUpdate();
        });
      } else {
        checkEmailAndUpdate();
      }
      
      function checkEmailAndUpdate() {
        // Kiểm tra email đã tồn tại (nếu thay đổi)
        if (email && email !== user.email) {
          db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id], (err, row) => {
            if (err) {
              console.error('Error checking email:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server' 
              });
            }
            
            if (row) {
              return res.status(400).json({ 
                success: false, 
                message: 'Email đã tồn tại' 
              });
            }
            
            // Tiếp tục với password check
            checkPasswordAndUpdate();
          });
        } else {
          checkPasswordAndUpdate();
        }
      }
      
      function checkPasswordAndUpdate() {
        // Nếu có thay đổi password
        if (new_password) {
          // Kiểm tra password hiện tại
          bcrypt.compare(current_password, user.password, (err, isMatch) => {
            if (err) {
              console.error('Error comparing password:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server' 
              });
            }
            
            if (!isMatch) {
              return res.status(400).json({ 
                success: false, 
                message: 'Mật khẩu hiện tại không đúng' 
              });
            }
            
            // Hash password mới
            bcrypt.hash(new_password, 10, (err, hashedPassword) => {
              if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ 
                  success: false, 
                  message: 'Lỗi server' 
                });
              }
              
              // Cập nhật user với password mới
              updateUserData(hashedPassword);
            });
          });
        } else {
          // Cập nhật user không có password
          updateUserData();
        }
      }
      
      function updateUserData(hashedPassword = null) {
        const updateFields = [];
        const updateValues = [];
        
        if (username) {
          updateFields.push('username = ?');
          updateValues.push(username);
        }
        
        if (email) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }
        
        if (hashedPassword) {
          updateFields.push('password = ?');
          updateValues.push(hashedPassword);
        }
        
        if (req.user.role === 'admin') {
          if (role !== undefined) {
            updateFields.push('role = ?');
            updateValues.push(role);
          }
          
          if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
          }
        }
        
        updateFields.push('updated_at = datetime("now")');
        updateValues.push(id);
        
        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        db.run(sql, updateValues, function(err) {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Lỗi khi cập nhật người dùng' 
            });
          }
          
          // Lấy thông tin user đã cập nhật
          db.get('SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?', 
            [id], (err, row) => {
              if (err) {
                console.error('Error fetching updated user:', err);
                return res.status(500).json({ 
                  success: false, 
                  message: 'Lỗi server' 
                });
              }
              
              res.json({
                success: true,
                message: 'Cập nhật người dùng thành công',
                data: row
              });
            });
        });
      }
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// Xóa user (chỉ admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ admin mới có quyền xóa người dùng' 
      });
    }
    
    // Không cho phép xóa admin
    db.get('SELECT role FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi server' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy người dùng' 
        });
      }
      
      if (user.role === 'admin') {
        return res.status(400).json({ 
          success: false, 
          message: 'Không thể xóa tài khoản admin' 
        });
      }
      
      // Xóa user
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi xóa người dùng' 
          });
        }
        
        res.json({
          success: true,
          message: 'Xóa người dùng thành công'
        });
      });
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 