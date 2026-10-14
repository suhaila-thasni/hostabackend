import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  createLeaveRequestSchema,
  updateLeaveStatusSchema,
  updateLeaveRequestSchema,
  leaveIdParamSchema,
} from "../validators/leaveRequest.validator";
import {
  applyLeaveRequest,
  getLeaveRequests,
  getLeaveStats,
  getLeaveRequestById,
  updateLeaveStatus,
  updateLeaveRequest,
  cancelLeaveRequest,
  deleteLeaveRequest,
} from "../controllers/leaveRequest.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

/* =========================================================================
   LEAVE MANAGEMENT ROUTES
========================================================================= */

// 1. Submit leave request (Doctor / Staff)
router.post(
  "/leave-requests",
  // authenticate, checkPermission("Leave", "create"),
  validate(createLeaveRequestSchema),
  applyLeaveRequest
);

// 2. Get leave statistics / counters (Total, Pending, Approved, Rejected)
router.get(
  "/leave-requests/stats",
  // authenticate, checkPermission("Leave", "view"),
  getLeaveStats
);

// 3. Get all leave requests (Filtered for Admin & Employees)
router.get(
  "/leave-requests",
  // authenticate, checkPermission("Leave", "view"),
  getLeaveRequests
);

// 4. Get single leave request by ID
router.get(
  "/leave-requests/:id",
  // authenticate, checkPermission("Leave", "view"),
  validateParams(leaveIdParamSchema),
  getLeaveRequestById
);

// 5. Admin Approve / Reject leave request
router.patch(
  "/leave-requests/:id/status",
  // authenticate, checkPermission("Leave", "edit"),
  validateParams(leaveIdParamSchema),
  validate(updateLeaveStatusSchema),
  updateLeaveStatus
);

router.put(
  "/leave-requests/:id/status",
  // authenticate, checkPermission("Leave", "edit"),
  validateParams(leaveIdParamSchema),
  validate(updateLeaveStatusSchema),
  updateLeaveStatus
);

// 6. Update / Edit leave request details
router.put(
  "/leave-requests/:id",
  // authenticate, checkPermission("Leave", "edit"),
  validateParams(leaveIdParamSchema),
  validate(updateLeaveRequestSchema),
  updateLeaveRequest
);

// 7. Cancel leave request (Employee cancels their pending leave)
router.post(
  "/leave-requests/:id/cancel",
  // authenticate, checkPermission("Leave", "edit"),
  validateParams(leaveIdParamSchema),
  cancelLeaveRequest
);

router.patch(
  "/leave-requests/:id/cancel",
  // authenticate, checkPermission("Leave", "edit"),
  validateParams(leaveIdParamSchema),
  cancelLeaveRequest
);

// 8. Delete leave request (Admin)
router.delete(
  "/leave-requests/:id",
  // authenticate, checkPermission("Leave", "delete"),
  validateParams(leaveIdParamSchema),
  deleteLeaveRequest
);

export default router;
