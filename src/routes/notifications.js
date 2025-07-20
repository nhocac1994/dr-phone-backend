const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Lưu subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription data is required' 
      });
    }

    // Kiểm tra subscription đã tồn tại chưa
    const existingSubscription = db.prepare(`
      SELECT * FROM push_subscriptions 
      WHERE endpoint = ? AND user_id = ?
    `).get(subscription.endpoint, userId);

    if (existingSubscription) {
      // Cập nhật subscription hiện tại
      db.prepare(`
        UPDATE push_subscriptions 
        SET auth = ?, p256dh = ?, updated_at = CURRENT_TIMESTAMP
        WHERE endpoint = ? AND user_id = ?
      `).run(
        subscription.keys.auth,
        subscription.keys.p256dh,
        subscription.endpoint,
        userId
      );
    } else {
      // Tạo subscription mới
      db.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, auth, p256dh, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        userId,
        subscription.endpoint,
        subscription.keys.auth,
        subscription.keys.p256dh
      );
    }

    res.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Xóa subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription data is required' 
      });
    }

    // Xóa subscription
    const result = db.prepare(`
      DELETE FROM push_subscriptions 
      WHERE endpoint = ? AND user_id = ?
    `).run(subscription.endpoint, userId);

    res.json({ 
      success: true, 
      message: 'Subscription removed successfully',
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Lấy danh sách subscriptions của user
router.get('/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscriptions = db.prepare(`
      SELECT * FROM push_subscriptions 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({ 
      success: true, 
      data: subscriptions 
    });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Gửi thông báo test
router.post('/test', async (req, res) => {
  try {
    const { userId, message = 'Test notification from Dr.Phone' } = req.body;
    
    // Lấy subscriptions của user
    const subscriptions = db.prepare(`
      SELECT * FROM push_subscriptions 
      WHERE user_id = ?
    `).all(userId);

    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subscriptions found for this user' 
      });
    }

    // Gửi thông báo đến tất cả subscriptions
    const results = [];
    for (const subscription of subscriptions) {
      try {
        // Đây là nơi bạn sẽ tích hợp với service push notification thực tế
        // Ví dụ: Firebase Cloud Messaging, OneSignal, hoặc web-push library
        console.log('Sending notification to:', subscription.endpoint);
        
        // Mock response cho demo
        results.push({
          endpoint: subscription.endpoint,
          success: true,
          message: 'Notification sent successfully'
        });
      } catch (error) {
        console.error('Error sending notification to:', subscription.endpoint, error);
        results.push({
          endpoint: subscription.endpoint,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Test notifications sent',
      results 
    });
  } catch (error) {
    console.error('Error sending test notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Gửi thông báo cho đơn hàng mới
router.post('/order-notification', async (req, res) => {
  try {
    const { orderId, orderData } = req.body;
    
    // Lấy tất cả subscriptions của admin users
    const adminSubscriptions = db.prepare(`
      SELECT ps.* FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.role = 'admin'
    `).all();

    if (adminSubscriptions.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No admin subscriptions found' 
      });
    }

    // Gửi thông báo đến tất cả admin
    const results = [];
    for (const subscription of adminSubscriptions) {
      try {
        // Tạo nội dung thông báo
        const notificationData = {
          title: 'Đơn hàng mới',
          body: `Khách hàng ${orderData.customer_name} vừa đặt dịch vụ ${orderData.service_name}`,
          data: {
            orderId: orderId,
            type: 'new_order',
            url: `/admin/orders?id=${orderId}`
          },
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: `order-${orderId}`,
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'Xem chi tiết'
            },
            {
              action: 'close',
              title: 'Đóng'
            }
          ]
        };

        console.log('Sending order notification to:', subscription.endpoint);
        
        // Mock response cho demo
        results.push({
          endpoint: subscription.endpoint,
          success: true,
          message: 'Order notification sent successfully'
        });
      } catch (error) {
        console.error('Error sending order notification to:', subscription.endpoint, error);
        results.push({
          endpoint: subscription.endpoint,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Order notifications sent',
      results 
    });
  } catch (error) {
    console.error('Error sending order notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 