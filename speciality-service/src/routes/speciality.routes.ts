import { Router } from "express";
import {
  Registeration,
  getanSpeciality,
  updateData,
  specialityDelete,
  getSpecialitys,
} from "../controllers/speciality.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();



// CRUD

router.post("/speciality",authenticate,checkPermission("speciality", "create"),Registeration);
router.get("/speciality", authenticate, checkPermission("speciality", "view"),getSpecialitys);
router.get("/speciality/:id",authenticate, checkPermission("speciality", "view"), getanSpeciality);
router.put("/speciality/:id",authenticate, checkPermission("speciality", "edit"), updateData);
router.delete("/speciality/:id",authenticate, checkPermission("speciality", "delete"), specialityDelete);


export default router;