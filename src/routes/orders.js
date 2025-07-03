const express = require('express');
const router = express.Router();
const { getAll, getMine, create, update, remove } = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

router.get('/', verifyToken, isAdmin, getAll);
router.get('/mine', verifyToken, getMine);
router.post('/', verifyToken, create);
router.put('/:id', verifyToken, isAdmin, update);
router.delete('/:id', verifyToken, isAdmin, remove);

module.exports = router; 