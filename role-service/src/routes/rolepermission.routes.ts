import { Router } from "express";
import {
createRolepermission,
getRolepermission,
getanRolepermission,
rolepermissionDelete,
updateData
 
} from "../controllers/rolepermission.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post("/rolepermission", authenticate, createRolepermission);
router.get("/rolepermission", authenticate, getRolepermission);
router.get("/rolepermission/:id", authenticate, getanRolepermission);
router.put("/rolepermission/:id", authenticate, updateData);
router.delete("/rolepermission/:id", authenticate, rolepermissionDelete);

export default router;