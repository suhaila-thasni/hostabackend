import { Router } from "express";
import {
  Registeration,
  getanMedicinremainder,
  updateData,
  medicinremainderDelete,
  getMedicinremainder,
 
} from "../controllers/medicinremainder.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();


router.post("/medicinremainder", authenticate, checkPermission("medicinremainder", "create"), Registeration);


// CRUD

router.get("/medicinremainder", authenticate, checkPermission("medicinremainder", "view"), getMedicinremainder);
router.get("/medicinremainder/:id", authenticate, checkPermission("medicinremainder", "view"), getanMedicinremainder);
router.put("/medicinremainder/:id", authenticate, checkPermission("medicinremainder", "edit"), updateData);
router.delete("/medicinremainder/:id", authenticate, checkPermission("medicinremainder", "delete"), medicinremainderDelete);

export default router;





