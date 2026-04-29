import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Rolepermission from "../models/rolepermission.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";

// REGISTER - POST /Rolepermission

export const createRolepermission: any =
  asyncHandler(async (req: Request, res: Response): Promise<void> => {

    const { roleId, permissionIds } = req.body;

    if (!roleId || !permissionIds) {
     res.status(400).json({
        message: "roleId and permissionIds required",
      });
    }

    if (!Array.isArray(permissionIds)) {
      res.status(400).json({
        message: "permissionIds must be array",
      });
    }

    const rolePermissions =
      permissionIds.map((pid: number) => ({
        roleId,
        permissionId: pid,
      }));

    const result =
      await Rolepermission.bulkCreate(rolePermissions);

    res.status(201).json({
      success: true,
      message: "Role permissions assigned",
      data: result,
    });

  });



// GET ONE - GET /Rolepermission/:id
export const getanRolepermission : any = asyncHandler(async (req: Request, res: Response) => {
  const rolepermission = await Rolepermission.findByPk(req.params.id);
  if (!rolepermission) {
    res.status(404).json({
      success: false,
      message: "Rolepermission not found",
      data: null,
      error: { code: "ROLEPERMISSION_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: rolepermission,
    error: null,
  });
});

// UPDATE - PUT /Rolepermission/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const rolepermission = await Rolepermission.update(updatePayload, {
    where: { id: id },
    returning: true,
  });


  if (!rolepermission[1] || rolepermission[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Rolepermission not found",
      status: 200,
      data: null,
      error: { code: "ROLEPERMISSION_NOT_FOUND", details: null },
    });
    return;
  }

  // ✅ Get updated booking object
  const updatedRolepermission = Rolepermission[1][0];

  await publishEvent("rolepermission_events", "ROLEPERMISSION_UPDATED", {
    RolepermissionId: updatedRolepermission.id,
  });



  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: updatedRolepermission,
    error: null,
  });
});

// DELETE - DELETE /Rolepermission/:id
export const rolepermissionDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rolepermission = await Rolepermission.findByPk(id);
  if (!rolepermission) {
    res.status(404).json({
      success: false,
      message: "Rolepermission not found",
      data: null,
      error: { code: "ROLEPERMISSION_NOT_FOUND", details: null },
    });
    return;
  }


  await Rolepermission.destroy({
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

// GET ALL - GET /Rolepermission
export const getRolepermission: any = asyncHandler(async (req: Request, res: Response) => {
  const rolepermission = await Rolepermission.findAll();

  if (rolepermission.length === 0) {
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
    data: rolepermission,
    error: null,
  });
});


