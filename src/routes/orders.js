const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/', auth, orderController.getAll);
router.get('/mine', auth, orderController.getMine);
router.get('/notification-count', auth, orderController.getNotificationCount);
router.post('/', orderController.create); // Không yêu cầu auth để khách hàng có thể đặt lịch
router.put('/:id', auth, isAdmin, orderController.update);
router.delete('/:id', auth, isAdmin, orderController.remove);

module.exports = router; 