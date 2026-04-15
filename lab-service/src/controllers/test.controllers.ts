import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Test from "../models/test.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /test/create
export const create: any = asyncHandler(async (req: Request, res: Response) => {
  const {  test_name, test_no, discount, type } = req.body;



  const exist = await Test.findOne({ where: { test_name: test_name } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Test name is already exist",
      data: null,
      error: { code: "TEST_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newTest = await Test.create({
   test_name,
   test_no,
   discount,
   type
  });

  await publishEvent("test_events", "TEST_REGISTERED", {
    testId: newTest.id,
  });

  res.status(201).json({
    success: true,
    message: "Test created successfully",
    data: null,
    error: null,
  });
});



// GET ONE - GET /test/:id
export const getanTest : any = asyncHandler(async (req: Request, res: Response) => {
  const test = await  Test.findByPk(req.params.id);
  if (!test) {
    res.status(404).json({
      success: false,
      message: "Test not found",
      data: null,
      error: { code: "TEST_NOT_FOUND", details: null },
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

// UPDATE - PUT /test/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const test = await Test.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!test[1] || test[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Test not found",
      status: 200,
      data: null,
      error: { code: "TEST_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("test_events", "LAB_UPDATED", {
    testId: test[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: test[1][0],
    error: null,
  });
});

// DELETE - DELETE /test/:id
export const testDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const test = await Test.findByPk(id);
  if (!test) {
    res.status(404).json({
      success: false,
      message: "Test not found",
      data: null,
      error: { code: "TEST_NOT_FOUND", details: null },
    });
    return;
  }

  await Test.destroy({
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

// GET ALL - GET /test
export const getTest: any = asyncHandler(async (req: Request, res: Response) => {
  const test = await Test.findAll();
  

  if (test.length === 0) {
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
    data: test,
    error: null,
  });
});



