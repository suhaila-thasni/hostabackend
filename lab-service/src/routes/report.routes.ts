import { Router } from "express";
import {
  create,
  getanReport,
  updateData,
  reportDelete,
  getReport,

} from "../controllers/report.controllers";

import { authenticate, restrictTo } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

// CRUD
router.post("/report/register", authenticate, checkPermission("report", "create"), create);
router.get("/report", authenticate, checkPermission("report", "view"), getReport);
router.get("/report/:id", authenticate, checkPermission("report", "view"), getanReport);
router.put("/report/:id", authenticate, checkPermission("report", "edit"), updateData);
router.delete("/report/:id", authenticate, checkPermission("report", "delete"), reportDelete);


export default router;