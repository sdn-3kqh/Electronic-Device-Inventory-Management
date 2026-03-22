const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, adminOnly, allRoles } = require('../middleware/auth');

// Admin only: Create, Update, Delete
router.post('/', [authenticate, adminOnly], departmentController.createDepartment);
router.put('/:id', [authenticate, adminOnly], departmentController.updateDepartment);
router.delete('/:id', [authenticate, adminOnly], departmentController.deleteDepartment);

// All roles: View
router.get('/', [authenticate, allRoles], departmentController.getAllDepartments);
router.get('/:id', [authenticate, allRoles], departmentController.getDepartmentById);

module.exports = router;
