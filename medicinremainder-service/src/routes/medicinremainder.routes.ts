import { Router } from "express";
import {
  Registeration,
  getanMedicinremainder,
  updateData,
  medicinremainderDelete,
  getMedicinremainder,
 
} from "../controllers/medicinremainder.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();


router.post("/medicinremainder/register", authenticate, Registeration);


// CRUD

router.get("/medicinremainder", authenticate, getMedicinremainder);
router.get("/medicinremainder/:id", authenticate, getanMedicinremainder);
router.put("/medicinremainder/:id", authenticate, updateData);
router.delete("/medicinremainder/:id", authenticate, medicinremainderDelete);

export default router;





