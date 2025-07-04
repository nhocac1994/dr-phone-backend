const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/', auth, isAdmin, userController.getUsers);
router.get('/:id', auth, isAdmin, userController.getUser);
router.post('/', auth, isAdmin, userController.createUser);
router.put('/:id', auth, isAdmin, userController.updateUser);
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router; 