const db = require('../config/db');

const orderController = {
  // Lấy tất cả đơn hàng (admin only)
  getAll: (req, res) => {
    const query = `
      SELECT o.*, 
             s.name as service_name, 
             s.price as service_price,
             u.username as user_username
      FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    
    db.all(query, [], (err, orders) => {
      if (err) {
        console.error('Error getting orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(orders);
    });
  },

  // Lấy đơn hàng của user hiện tại
  getMine: (req, res) => {
    const query = `
      SELECT o.*, 
             s.name as service_name, 
             s.price as service_price
      FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    
    db.all(query, [req.user.id], (err, orders) => {
      if (err) {
        console.error('Error getting user orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(orders);
    });
  },

  // Tạo đơn hàng mới
  create: (req, res) => {
    const { service_id, customer_name, customer_phone, customer_email, scheduled_time, notes } = req.body;
    
    if (!service_id || !customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO orders (
        user_id, 
        service_id, 
        customer_name, 
        customer_phone, 
        customer_email, 
        scheduled_time, 
        notes,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    db.run(
      query, 
      [req.user.id, service_id, customer_name, customer_phone, customer_email, scheduled_time, notes],
      function(err) {
        if (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ 
          id: this.lastID,
          user_id: req.user.id,
          service_id,
          customer_name,
          customer_phone,
          customer_email,
          scheduled_time,
          notes,
          status: 'pending'
        });
      }
    );
  },

  // Cập nhật đơn hàng
  update: (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const query = `
      UPDATE orders 
      SET status = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(query, [status, notes, id], function(err) {
      if (err) {
        console.error('Error updating order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ 
        id: parseInt(id),
        status,
        notes,
        updated_at: new Date().toISOString()
      });
    });
  },

  // Xóa đơn hàng
  remove: (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM orders WHERE id = ?';
    
    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error deleting order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ message: 'Order deleted successfully' });
    });
  }
};

module.exports = orderController; 