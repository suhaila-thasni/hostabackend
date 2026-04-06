import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import BloodBank from "../models/bloodBank.model";

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// 🧩 Upsert/Create/Update Stocks
export const createOrUpdateStock = asyncHandler(async (req: Request, res: Response) => {
  const { bloodGroup, count } = req.body;

  // Validation
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    res.status(400).json({ 
        success: false, 
        message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` 
    });
    return;
  }

  // Smart Upsert Logic
  let stock = await BloodBank.findOne({ where: { bloodGroup } });

  if (stock) {
    // ⚔️ Update existing record
    await stock.update({ count: count || 0 });
    res.status(200).json({ 
        success: true, 
        message: `Blood group ${bloodGroup} inventory updated to ${count}`, 
        data: stock 
    });
  } else {
    // ⚔️ Create new record
    stock = await BloodBank.create({ bloodGroup, count: count || 0 });
    res.status(201).json({ 
        success: true, 
        message: `Blood group ${bloodGroup} record created with ${count} units`, 
        data: stock 
    });
  }
});

// 🔍 Get All Inventory
export const getAllStock = asyncHandler(async (req: Request, res: Response) => {
  const stocks = await BloodBank.findAll({
    order: [['bloodGroup', 'ASC']]
  });
  res.status(200).json({ success: true, count: stocks.length, data: stocks });
});

// ✏️ Partial Update (via blood group parameter)
export const updateStockByGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = req.params.group;
  const count = req.body.count;

  const stock = await BloodBank.findOne({ where: { bloodGroup: group } });
  if (!stock) {
    res.status(404).json({ success: false, message: `No inventory record for ${group}` });
    return;
  }
  
  await stock.update({ count });
  res.status(200).json({ success: true, data: stock });
});

// ❌ Delete Entry
export const deleteStock = asyncHandler(async (req: Request, res: Response) => {
  const group = req.params.group;
  const deleted = await BloodBank.destroy({ where: { bloodGroup: group } });
  
  if (!deleted) {
      res.status(404).json({ success: false, message: `No inventory record for ${group}` });
      return;
  }
  
  res.status(200).json({ success: true, message: `Blood group ${group} inventory removed` });
});
