const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/', auth, isAdmin, orderController.getAll);
router.get('/mine', auth, orderController.getMine);
router.post('/', auth, orderController.create);
router.put('/:id', auth, isAdmin, orderController.update);
router.delete('/:id', auth, isAdmin, orderController.remove);

module.exports = router; 