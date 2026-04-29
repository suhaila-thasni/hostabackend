import { Router } from "express";
import {
  createPresignurl,
  deleteAPresignurl,
  editAPresignurl
} from "../controllers/presignurl.controllers";

const router = Router();




// CRUD

router.post(
  "/presignurl",
  createPresignurl
);

router.put(
  "/presignurl",
  editAPresignurl
);

router.delete(
  "/presignurl",
  deleteAPresignurl
);

export default router;