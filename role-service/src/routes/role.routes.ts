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
router.get("/role", authenticate, getRole);
router.get("/role/:id", authenticate, getanRole);
router.put("/role/:id", authenticate, updateData);
router.delete("/role/:id", authenticate, roleDelete);

export default router;