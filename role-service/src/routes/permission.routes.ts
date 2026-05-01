import { Router } from "express";
import {
    checkPermissionService,
createPermission,
getPermission,
getanPermission,
permissionDelete,
updateData
 
} from "../controllers/permission.controllers";

const router = Router();




// CRUD

router.post("/permission", createPermission);
router.get("/permission", getPermission);
router.get("/permission/:id", getanPermission);
router.put("/permission/:id", updateData);
router.delete("/permission/:id", permissionDelete);
router.post(
  "/check-permission",
  checkPermissionService
);


export default router;