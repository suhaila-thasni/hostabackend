import { Router } from "express";
import {
createRole,
getRole,
getanRole,
roleDelete,
updateData
 
} from "../controllers/role.controllers";

const router = Router();




// CRUD

router.post("/role", createRole);
router.get("/role", getRole);
router.get("/role/:id", getanRole);
router.put("/role/:id", updateData);
router.delete("/role/:id", roleDelete);

export default router;