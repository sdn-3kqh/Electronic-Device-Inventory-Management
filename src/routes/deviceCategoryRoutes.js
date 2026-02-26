const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, adminOnly, allRoles } = require('../middleware/auth');

// Create category (Admin only)
router.post('/', [authenticate, adminOnly], categoryController.createCategory);

// Update category (Admin only)
router.put('/:id', [authenticate, adminOnly], categoryController.updateCategory);

// Delete category (Admin only)
router.delete('/:id', [authenticate, adminOnly], categoryController.deleteCategory);

// Get category details (All roles)
router.get('/:id', [authenticate, allRoles], categoryController.getCategoryDetails);

// Get all categories (All roles)
router.get('/', [authenticate, allRoles], categoryController.getAllCategories);

module.exports = router;