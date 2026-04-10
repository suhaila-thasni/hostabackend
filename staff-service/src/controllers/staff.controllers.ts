import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Staff from "../models/staff.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /staff/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  
  const { name, phone, email, password,  designation, joiningDate, jobType, staffType,  dob, gender, knowLanguages, qualification, address } = req.body;


  const exist = await Staff.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Staff is already exist",
      data: null,
      error: { code: "STAFF_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newStaff = await Staff.create({
   name, 
   phone, 
   email, 
   password, 
   dob, 
   gender, 
   knowLanguages, 
   qualification, 
   address, 
   designation, joiningDate, jobType, staffType,
  });

  await publishEvent("staff_events", "STAFF_REGISTERED", {
    staffId: newStaff.id,
    phone: newStaff.phone,
  });

  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});

// LOGIN - POST /staff/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const staff = await Staff.findOne({ where: { email: email } });
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found! Please register",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, staff.password || "");
  if (!checkPassword) {
    res.status(404).json({
      success: false,
      message: "Wrong password, Plese try again",
      data: null,
      error: { code: "WRONG_PASSWORD", details: null },
    });
    return;
  }

  const jwtKey = process.env.JWT_SECRET;
  if (!jwtKey) {
    res.status(404).json({
      success: false,
      message: "JWT_SECRET is not defined",
      data: null,
      error: { code: "JWT_SECRET_NOT_DEFINED", details: null },
    });
    return;
  }

  // Generate JWT tokens
  const token = jwt.sign({ id: staff.id, name: staff.name}, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: staff.id, name: staff.name },
    jwtKey,
    { expiresIn: "7d" }
  );

  const sevenDayInMs = 7 * 24 * 60 * 60 * 1000;
  const expirationDate = new Date(Date.now() + sevenDayInMs);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    expires: expirationDate,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Loggedin successfully",
    status: 200,
    data: staff,
    error: null,
  });
});

// GET ONE - GET /staff/:id
export const getanStaff : any = asyncHandler(async (req: Request, res: Response) => {
  const staff = await Staff.findByPk(req.params.id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: staff,
    error: null,
  });
});

// UPDATE - PUT /staff/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const staff = await Staff.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!staff[1] || staff[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      status: 200,
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("staff_events", "STAFF_UPDATED", {
    staffId: staff[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: staff[1][0],
    error: null,
  });
});

// DELETE - DELETE /staff/:id
export const staffDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await Staff.findByPk(id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  // 🔥 Perform Soft Delete (requires paranoid: true in model)
  await staff.destroy();

  res.status(200).json({
    success: true,
    message: "Staff soft-deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /staff
export const getStaffs: any = asyncHandler(async (req: Request, res: Response) => {
  const staff = await Staff.findAll();

  if (staff.length === 0) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: staff,
    error: null,
  });
});

// FORGET PASSWORD - POST /staff/forgot
export const forgetpassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const staff = await Staff.findOne({ where: { email } });
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: staff,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /staff/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { password, email } = req.body;

  const staff = await Staff.findOne({ where: { email } });
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  staff.password = hashedPassword;

  await staff.save();

  res.status(200).json({
    success: true,
    status: 200,
    data: staff,
    error: null,
  });
});