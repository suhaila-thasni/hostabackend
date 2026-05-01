import { Router } from "express";
import {
  Registeration,
  getanRating,
  updateData,
  ratingDelete,
  getRating,

} from "../controllers/rating.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post("/rating", authenticate, Registeration);
router.get("/rating", getRating);
router.get("/rating/:id", authenticate, getanRating);
router.put("/rating/:id", authenticate, updateData);
router.delete("/rating/:id", authenticate, ratingDelete);



export default router;


