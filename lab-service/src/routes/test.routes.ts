import { Router } from "express";
import {
  create,
  getanTest,
  updateData,
  testDelete,
  getTest,

} from "../controllers/test.controllers";

const router = Router();



// CRUD

router.post("/test/register", create);
router.get("/test", getTest);
router.get("/test/:id", getanTest);
router.put("/test/:id", updateData);
router.delete("/test/:id", testDelete);

export default router;