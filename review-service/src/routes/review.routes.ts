import { Router } from "express";
import {
  Registeration,
  getanReview,
  updateData,
  reviewDelete,
  getReview,

 
} from "../controllers/review.controllers";

const router = Router();




// CRUD

router.post("/review/register", Registeration);
router.get("/review", getReview);
router.get("/review/:id", getanReview);
router.put("/review/:id", updateData);
router.delete("/review/:id", reviewDelete);



export default router;