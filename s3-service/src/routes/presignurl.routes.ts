import { Router } from "express";
import {
  createPresignurl,
  deleteAPresignurl,
  editAPresignurl
} from "../controllers/presignurl.controllers";
import { authenticate } from "../middleware/authenticate";

const router = Router();




// CRUD

router.post(
  "/presignurl",
  authenticate,
  createPresignurl
);

router.put(
  "/presignurl",
  authenticate,
  editAPresignurl
);

router.delete(
  "/presignurl",
  authenticate,
  deleteAPresignurl
);

export default router;