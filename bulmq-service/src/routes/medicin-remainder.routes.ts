import { Router } from "express";
import {
  assignTaskMedicin,
} from "../controllers/medicin-remainder.controllers";

const router = Router();




// CRUD

router.post(
  "/medicin-task",
 assignTaskMedicin
);

export default router;