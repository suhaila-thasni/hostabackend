import { Router } from "express";
import {
createRolepermission,
getRolepermission,
getanRolepermission,
rolepermissionDelete,
updateData
 
} from "../controllers/rolepermission.controllers";

const router = Router();




// CRUD

router.post("/rolepermission", createRolepermission);
router.get("/rolepermission", getRolepermission);
router.get("/rolepermission/:id", getanRolepermission);
router.put("/rolepermission/:id", updateData);
router.delete("/rolepermission/:id", rolepermissionDelete);

export default router;