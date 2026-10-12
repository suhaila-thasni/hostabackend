import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { patientVitalsService } from "../services/patientVitals.service";
import { publishEvent } from "../events/publisher";
import Patient from "../models/patient.model";
import PatientVitals from "../models/patientVitals.model";
import { Op } from "sequelize";

// ADD VITALS
export const addVitals: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    // const patientId = parseInt(req.params.patientId);
    const vitals = await patientVitalsService.addVitals(req.body.patientId, req.body);

    // Get patient name for event payload
    const patientRecord = await Patient.findByPk(vitals.patientId);
    const actualPatientName = patientRecord?.name || "Unknown Patient";

    try {
      await publishEvent("patientvitals_events", "PATIENTVITALS_REGISTERED", {
        id: vitals.id,
        patientId: vitals.patientId,
        prescriptionId: vitals.prescriptionId,
        temperature: vitals.temperature,
        pulse: vitals.pulse,
        respiratoryRate: vitals.respiratoryRate,
        spo2: vitals.spo2,
        height: vitals.height,
        weight: vitals.weight,
        bmi: vitals.bmi,
        waist: vitals.waist,
        bsa: vitals.bsa,
        patientName: actualPatientName,
        actorName: (req as any).user?.name || req.body.actorName || "Unknown",
        actorRole: (req as any).user?.role || req.body.actorRole || "Staff",
        ipAddress: req.ip || "Unknown IP",
      });
    } catch (err: any) {
      console.error("Failed to publish PATIENTVITALS_REGISTERED event:", { error: err.message });
    }

    res.status(201).json({
      success: true,
      message: "Vitals recorded successfully",
      data: vitals,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

// GET ALL VITALS FOR A PATIENT
export const getVitalsByPatient: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const vitals = await patientVitalsService.getVitalsByPatient(patientId);
    res.status(200).json({
      success: true,
      data: vitals,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});


// export const getAllVitals = asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const vitals = await patientVitalsService.getAllVitals();

//     res.status(200).json({
//       success: true,
//       data: vitals,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });
// GET LATEST VITALS FOR A PATIENT
export const getLatestVitals: any = asyncHandler(async (req: Request, res: Response) => {
  try {

    const normalizeQuery = (value: any) =>
      Array.isArray(value) ? value[0] : value;

    let {
      patientId
    }: any = req.query;

    patientId = normalizeQuery(patientId);

    const vitals = await patientVitalsService.getLatestVitals(Number(patientId));
    res.status(200).json({
      success: true,
      data: vitals,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

// GET ONE VITALS RECORD
export const getVitalsById: any = asyncHandler(async (req: Request, res: Response) => {
  try {


    const id = parseInt(req.params.id);
    const vitals = await patientVitalsService.getVitalsById(id);
    res.status(200).json({
      success: true,
      data: vitals,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

// UPDATE VITALS
export const updateVitals: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const vitals = await patientVitalsService.updateVitals(id, req.body);

    // Get patient name for event payload
    const patientRecord = await Patient.findByPk(vitals.patientId);
    const actualPatientName = patientRecord?.name || "Unknown Patient";

    try {
      await publishEvent("patientvitals_events", "PATIENTVITALS_UPDATED", {
        id: vitals.id,
        patientId: vitals.patientId,
        prescriptionId: vitals.prescriptionId,
        temperature: vitals.temperature,
        pulse: vitals.pulse,
        respiratoryRate: vitals.respiratoryRate,
        spo2: vitals.spo2,
        height: vitals.height,
        weight: vitals.weight,
        bmi: vitals.bmi,
        waist: vitals.waist,
        bsa: vitals.bsa,
        patientName: actualPatientName,
        actorName: (req as any).user?.name || req.body.actorName || "Unknown",
        actorRole: (req as any).user?.role || req.body.actorRole || "Staff",
        ipAddress: req.ip || "Unknown IP",
      });
    } catch (err: any) {
      console.error("Failed to publish PATIENTVITALS_UPDATED event:", { error: err.message });
    }

    res.status(200).json({
      success: true,
      message: "Vitals updated successfully",
      data: vitals,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

// DELETE VITALS (soft delete)
export const deleteVitals: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Get vitals before deletion for event payload
    const vitals = await PatientVitals.findByPk(id);
    if (!vitals) {
      res.status(404).json({ success: false, message: "Vitals record not found" });
      return;
    }

    // Get patient name for event payload
    const patientRecord = await Patient.findByPk(vitals.patientId);
    const actualPatientName = patientRecord?.name || "Unknown Patient";

    await patientVitalsService.deleteVitals(id);

    try {
      await publishEvent("patientvitals_events", "PATIENTVITALS_DELETED", {
        id: vitals.id,
        patientId: vitals.patientId,
        prescriptionId: vitals.prescriptionId,
        temperature: vitals.temperature,
        pulse: vitals.pulse,
        respiratoryRate: vitals.respiratoryRate,
        spo2: vitals.spo2,
        height: vitals.height,
        weight: vitals.weight,
        bmi: vitals.bmi,
        waist: vitals.waist,
        bsa: vitals.bsa,
        patientName: actualPatientName,
        actorName: (req as any).user?.name || req.body.actorName || "Unknown",
        actorRole: (req as any).user?.role || req.body.actorRole || "Staff",
        ipAddress: req.ip || "Unknown IP",
      });
    } catch (err: any) {
      console.error("Failed to publish PATIENTVITALS_DELETED event:", { error: err.message });
    }

    res.status(200).json({
      success: true,
      message: "Vitals record deleted",
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});
