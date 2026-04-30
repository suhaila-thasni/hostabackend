import { Router } from "express";
import {
  Registeration,
  getanReview,
  updateData,
  reviewDelete,
  getReview,

} from "../controllers/review.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post("/review", authenticate, Registeration);
router.get("/review", getReview);
router.get("/review/:id",authenticate, getanReview);
router.put("/review/:id", authenticate, updateData);
router.delete("/review/:id", authenticate, reviewDelete);



export default router;