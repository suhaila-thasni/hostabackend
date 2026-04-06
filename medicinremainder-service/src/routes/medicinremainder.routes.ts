import { Router } from "express";
import {
  Registeration,
  getanMedicinremainder,
  updateData,
  medicinremainderDelete,
  getMedicinremainder,
 
} from "../controllers/medicinremainder.controllers";

const router = Router();


router.post("/medicinremainder/register", Registeration);


// CRUD

router.get("/medicinremainder", getMedicinremainder);
router.get("/medicinremainder/:id", getanMedicinremainder);
router.put("/medicinremainder/:id", updateData);
router.delete("/medicinremainder/:id", medicinremainderDelete);

export default router;