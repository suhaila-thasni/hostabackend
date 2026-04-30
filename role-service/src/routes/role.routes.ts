import { Router } from "express";
import {
createRole,
getRole,
getanRole,
roleDelete,
updateData
 
} from "../controllers/role.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post("/role", authenticate,  createRole);
router.get("/role", getRole);
router.get("/role/:id", getanRole);
router.put("/role/:id", updateData);
router.delete("/role/:id", roleDelete);

export default router;