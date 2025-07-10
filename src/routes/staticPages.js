const express = require('express');
const router = express.Router();
const staticPagesController = require('../controllers/staticPagesController');

router.get('/:slug', staticPagesController.getPage);
router.post('/', staticPagesController.createPage);
router.put('/:slug', staticPagesController.updatePage);

module.exports = router; 