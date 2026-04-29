import { Router } from "express";
import {
  Registeration,
  getanSpeciality,
  updateData,
  specialityDelete,
  getSpecialitys,
} from "../controllers/speciality.controllers";
import { authenticate } from "../middleware/authenticate";
<<<<<<< HEAD
=======
import { checkPermission } from "../middleware/role.middleware";
>>>>>>> b997efb301d8cc30cdaec2026868dbba50a2d07d

const router = Router();



// CRUD

<<<<<<< HEAD
router.post("/speciality/register",authenticate,Registeration);
router.get("/speciality", authenticate, getSpecialitys);
router.get("/speciality/:id",authenticate, getanSpeciality);
router.put("/speciality/:id",authenticate, updateData);
router.delete("/speciality/:id",authenticate, specialityDelete);
=======
router.post("/speciality", authenticate, checkPermission("speciality", "create"), Registeration);
router.get("/speciality", authenticate, checkPermission("speciality", "view"), getSpecialitys);
router.get("/speciality/:id", authenticate, checkPermission("speciality", "view"), getanSpeciality);
router.put("/speciality/:id", authenticate, checkPermission("speciality", "edit"), updateData);
router.delete("/speciality/:id", authenticate, checkPermission("speciality", "delete"), specialityDelete);
>>>>>>> b997efb301d8cc30cdaec2026868dbba50a2d07d

export default router;