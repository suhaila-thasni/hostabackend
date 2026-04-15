import { Router } from "express";
import {
  create,
  getanReport,
  updateData,
  reportDelete,
  getReport,

} from "../controllers/report.controllers";

const router = Router();



// CRUD

router.post("/report/register", create);
router.get("/report", getReport);
router.get("/report/:id", getanReport);
router.put("/report/:id", updateData);
router.delete("/report/:id", reportDelete);

export default router;