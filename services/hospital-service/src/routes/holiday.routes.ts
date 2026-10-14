import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import { createHolidaySchema, updateHolidaySchema } from "../validators/holiday.validator";
import { idParamSchema } from "../validators/attendance.validator"; // Reusing idParamSchema
import {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holiday.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

router.post("/holidays",
  // authenticate,checkPermission("Holiday", "create"), 
   validate(createHolidaySchema), createHoliday);
router.get("/holidays",
  // authenticate, checkPermission("Holiday", "view"),
  getHolidays);
router.get("/holidays/:id",
  // authenticate, checkPermission("Holiday", "view"),
  validateParams(idParamSchema), getHolidayById);
router.put("/holidays/:id",
  // authenticate, checkPermission("Holiday", "edit"),
   validateParams(idParamSchema), validate(updateHolidaySchema), updateHoliday);
router.delete("/holidays/:id",
  //  authenticate, checkPermission("Holiday", "delete"),
    validateParams(idParamSchema), deleteHoliday);

export default router;
 