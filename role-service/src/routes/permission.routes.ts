import { Router } from "express";
import {
    checkPermissionService,
createPermission,
getPermission,
getanPermission,
permissionDelete,
updateData
 
} from "../controllers/permission.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post("/permission", authenticate, createPermission);
router.get("/permission", authenticate, getPermission);
router.get("/permission/:id", authenticate, getanPermission);
router.put("/permission/:id", authenticate, updateData);
router.delete("/permission/:id", authenticate, permissionDelete);
router.post(
  "/check-permission",
  authenticate,
  checkPermissionService
);


export default router;