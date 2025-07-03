const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', verifyToken, isAdmin, create);
router.put('/:id', verifyToken, isAdmin, update);
router.delete('/:id', verifyToken, isAdmin, remove);

module.exports = router; 