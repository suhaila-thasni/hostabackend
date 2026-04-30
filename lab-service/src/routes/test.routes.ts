import { Router } from "express";
import {
  create,
  getanTest,
  updateData,
  testDelete,
  getTest,

} from "../controllers/test.controllers";

import { authenticate, restrictTo } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

// CRUD
router.post("/test/register", authenticate,checkPermission("test", "create"), create);
router.get("/test", authenticate, checkPermission("test", "view"), getTest);
router.get("/test/:id", authenticate, checkPermission("test", "view"), getanTest);
router.put("/test/:id", authenticate, checkPermission("test", "edit"), updateData);
router.delete("/test/:id", authenticate, checkPermission("test", "delete"), testDelete);

export default router;






