import { Router } from "express";
import {
  createAd,
  getAds,
  getSingleAd,
  updateAd,
  deleteAd,
} from "../controllers/ad.controller";

const router = Router();

router.post("/ad", createAd);
router.get("/ad", getAds);
router.get("/ad/:id", getSingleAd);
router.put("/ad/:id", updateAd);
router.delete("/ad/:id", deleteAd);

export default router;
