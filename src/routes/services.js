const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { auth, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);

// Admin routes - yêu cầu đăng nhập và quyền admin
router.post('/', auth, isAdmin, serviceController.createService);
router.put('/:id', auth, isAdmin, serviceController.updateService);
router.delete('/:id', auth, isAdmin, serviceController.deleteService);

module.exports = router; 