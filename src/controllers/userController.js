const bcrypt = require('bcryptjs');
const db = require('../config/db');

const userController = {
  // Lấy danh sách users
  getUsers: (req, res) => {
    const query = `
      SELECT id, username, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, users) => {
      if (err) {
        console.error('Error getting users:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(users);
    });
  },

  // Lấy chi tiết một user
  getUser: (req, res) => {
    const { id } = req.params;
    const query = `
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = ?
    `;
    
    db.get(query, [id], (err, user) => {
      if (err) {
        console.error('Error getting user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    });
  },

  // Tạo user mới
  createUser: async (req, res) => {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [username, hashedPassword, role || 'user'], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          console.error('Error creating user:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ 
          id: this.lastID,
          username,
          role: role || 'user'
        });
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Cập nhật user
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    try {
      let query, params;
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query = `
          UPDATE users 
          SET username = ?, 
              password = ?, 
              role = ?
          WHERE id = ?
        `;
        params = [username, hashedPassword, role, id];
      } else {
        query = `
          UPDATE users 
          SET username = ?, 
              role = ?
          WHERE id = ?
        `;
        params = [username, role, id];
      }
      
      db.run(query, params, function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          console.error('Error updating user:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ 
          id: parseInt(id),
          username,
          role
        });
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Xóa user
  deleteUser: (req, res) => {
    const { id } = req.params;
    
    // Không cho phép xóa tài khoản admin mặc định
    if (id === '1') {
      return res.status(403).json({ error: 'Cannot delete default admin account' });
    }
    
    const query = 'DELETE FROM users WHERE id = ?';
    
    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  }
};

module.exports = userController; 