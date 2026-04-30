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

router.post("/review/register", authenticate, Registeration);
router.get("/review", getReview);
router.get("/review/:id", getanReview);
router.put("/review/:id", authenticate, updateData);
router.delete("/review/:id", authenticate, reviewDelete);



export default router;