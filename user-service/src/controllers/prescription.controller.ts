import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Patient from "../models/patient.model";
import Prescription from "../models/prescription.model";
import { publishEvent } from "../events/publisher";
import { httpClient } from "../utils/httpClient";


// REGISTER
export const createPrescription: any = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, hospitalId, doctorId,  patientId, complaint, medications, investigations, advice, next_consultation, empty_stomach  } = req.body;
  const authHeader = req.headers.authorization;

  const errors: string[] = [];

  // 1. Validate Patient (Local)
  const patientExists = await Patient.findByPk(patientId);
  if (!patientExists) {
    errors.push(`Patient with ID ${patientId} does not exist.`);
  }

  // 2. Validate Doctor (Cross-Service: doctor-service)
  try {
    console.log(`Verifying doctor at: http://doctor-service:3007/doctor/${doctorId}`);
    await httpClient.get(`http://doctor-service:3007/doctor/${doctorId}`, {
      headers: { Authorization: authHeader }
    });
  } catch (error: any) {
    console.error("Doctor validation failed:", error.message);
    errors.push(`Doctor with ID ${doctorId} does not exist or is unreachable.`);
  }

  // 3. Validate Hospital (Cross-Service: hospital-service)
  try {
    console.log(`Verifying hospital at: http://hospital-service:3009/hospital/${hospitalId}`);
    await httpClient.get(`http://hospital-service:3009/hospital/${hospitalId}`, {
      headers: { Authorization: authHeader }
    });
  } catch (error: any) {
    console.error("Hospital validation failed:", error.message);
    errors.push(`Hospital with ID ${hospitalId} does not exist or is unreachable.`);
  }

  // 4. Return all errors if any
  if (errors.length > 0) {
    res.status(404).json({
      success: false,
      message: "Validation failed",
      errors: errors
    });
    return;
  }

  // 5. Create Prescription
  const prescription = await Prescription.create({
    bookingId, hospitalId, doctorId,  patientId, complaint, medications, investigations, advice, next_consultation, empty_stomach 
  });


  res.status(201).json({
    success: true,
    message: "Prescription created successfully",
    data: prescription,
  });
});



// GET ALL USERS Prescription
export const getPrescription: any = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findAll();

  res.status(200).json({
    success: true,
    data: prescription,
  });
});

// GET ONE USER prescription
export const getAPrescription: any = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await Prescription.findByPk(req.params.id);

  if (!prescription) {
    res.status(404).json({
      success: false,
      message: "Prescription not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: prescription,
  });
});

// UPDATE - PUT /prescription/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const prescription = await Prescription.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!prescription[1] || prescription[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Prescription not found",
      status: 200,
      data: null,
      error: { code: "PRESCRIPTION_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("prescription_events", "PRESCRIPTION_UPDATED", {
    prescriptionId: prescription[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: prescription[1][0],
    error: null,
  });
});

// DELETE USER prescription
export const deletePrescription: any = asyncHandler(async (req: Request, res: Response) => {
  const user = await Prescription.findByPk(req.params.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "Prescription not found",
    });
    return;
  }

  await Prescription.destroy({ where: { id: req.params.id } });

  res.status(200).json({
    success: true,
    message: "Prescription deleted",
  });
});


