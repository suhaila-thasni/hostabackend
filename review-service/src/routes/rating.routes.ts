import { Router } from "express";
import {
  Registeration,
  getanRating,
  updateData,
  ratingDelete,
  getRating,

 
} from "../controllers/rating.controllers";

const router = Router();




// CRUD

router.post("/rating/register", Registeration);
router.get("/rating", getRating);
router.get("/rating/:id", getanRating);
router.put("/rating/:id", updateData);
router.delete("/rating/:id", ratingDelete);



export default router;