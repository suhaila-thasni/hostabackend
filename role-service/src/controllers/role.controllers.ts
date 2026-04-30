import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Role from "../models/role.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";
import dotenv from "dotenv";

// REGISTER - POST /role

export const createRole: any = asyncHandler(async (req: Request, res: Response) => {
  
  const { name, description,  hospitalId, labId } = req.body;

  if(hospitalId){
     try {

      console.log("Authorization Token:", req.headers.authorization);
       const hospital = await axios.get(`${process.env.HOSPITAL_SERVICE_API}/hospital/${hospitalId}`, {
         headers: { Authorization: req.headers.authorization }

       })
       console.log(hospital.data);  


       if(!hospital || !hospital.data) {
           res.status(404).json({
             success: false,
             message: "Hospital not found",
             data: null,
             error: { code: "HOSPITAL_NOT_FOUND", details: null },
           });
           return;
       }
     } catch (error: any) {
         res.status(error.response?.status || 500).json({
           success: false,
           message: "Failed to validate hospital",
           data: null,
           error: { code: "HOSPITAL_VALIDATION_ERROR", details: error.message },
         });
         return;
     }
  }


    if(labId){
     try {
       const lab = await axios.get(`${process.env.LAB_SERVICE_API}/lab/${labId}`, {
         headers: { Authorization: req.headers.authorization }
       })
       if(!lab || !lab.data) {
           res.status(404).json({
             success: false,
             message: "Lab not found",
             data: null,
             error: { code: "LAB_NOT_FOUND", details: null },
           });
           return;
       }
     } catch (error: any) {
         res.status(error.response?.status || 500).json({
           success: false,
           message: "Failed to validate lab",
           data: null,
           error: { code: "LAB_VALIDATION_ERROR", details: error.message },
         });
         return;
     }
  }
 

  const newRole = await Role.create({
    name, description,  hospitalId, labId
  });



  await publishEvent("role_events", "ROLE_REGISTERED", {
    roleId: newRole.id,
  });



  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});



// GET ONE - GET /role/:id
export const getanRole : any = asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) {
    res.status(404).json({
      success: false,
      message: "Role not found",
      data: null,
      error: { code: "ROLE_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: role,
    error: null,
  });
});

// UPDATE - PUT /role/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const role = await Role.update(updatePayload, {
    where: { id: id },
    returning: true,
  });


  if (!role[1] || role[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Role not found",
      status: 200,
      data: null,
      error: { code: "ROLE_NOT_FOUND", details: null },
    });
    return;
  }

  // ✅ Get updated booking object
  const updatedRole = role[1][0];

  await publishEvent("role_events", "ROLE_UPDATED", {
    roleId: updatedRole.id,
  });



  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: updatedRole,
    error: null,
  });
});

// DELETE - DELETE /role/:id
export const roleDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await Role.findByPk(id);
  if (!role) {
    res.status(404).json({
      success: false,
      message: "Role not found",
      data: null,
      error: { code: "ROLE_NOT_FOUND", details: null },
    });
    return;
  }


  await Role.destroy({
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

// GET ALL - GET /role
export const getRole: any = asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findAll();

  if (role.length === 0) {
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
    data: role,
    error: null,
  });
});


