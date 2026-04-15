import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Report from "../models/report.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /report/create
export const create: any = asyncHandler(async (req: Request, res: Response) => {
  const {name, email, phone, age, location, gender, test_reports, sample, sample_date,  result_ready, patientId, patient_type, dept_unit, invoice_no, invoice_date, referred_by, result_verified, doctorId } = req.body;



  const newReport = await Report.create({
   test_reports, sample, sample_date,  result_ready, patientId, patient_type, dept_unit, invoice_no, invoice_date, referred_by, result_verified, doctorId,
   name, email, phone, age, location, gender 
  });

  await publishEvent("report_events", "REPORT_REGISTERED", {
    reportId: newReport.id,
  });

  res.status(201).json({
    success: true,
    message: "Report created successfully",
    data: null,
    error: null,
  });
});



// GET ONE - GET /report/:id
export const getanReport : any = asyncHandler(async (req: Request, res: Response) => {
  const test = await  Report.findByPk(req.params.id);
  if (!test) {
    res.status(404).json({
      success: false,
      message: "Report not found",
      data: null,
      error: { code: "REPORT_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: test,
    error: null,
  });
});

// UPDATE - PUT /report/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const report = await Report.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!report[1] || report[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Report not found",
      status: 200,
      data: null,
      error: { code: "REPORT_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("report_events", "REPORT_UPDATED", {
    testId: report[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: report[1][0],
    error: null,
  });
});

// DELETE - DELETE /report/:id
export const reportDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const report = await Report.findByPk(id);
  if (!report) {
    res.status(404).json({
      success: false,
      message: "Report not found",
      data: null,
      error: { code: "REPORT_NOT_FOUND", details: null },
    });
    return;
  }

  await Report.destroy({
    where: { id: id }
  });


  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /report
export const getReport: any = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findAll();
  

  if (report.length === 0) {
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
    data: report,
    error: null,
  });
});



