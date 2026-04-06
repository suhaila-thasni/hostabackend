import { Request, Response } from "express";
import { Op } from "sequelize";
import BloodDonor from "../models/bloodDonor.model";
import axios from "axios";

// 🩸 Medical Compatibility Matrix (Recipient -> Compatible Donors)
const COMPATIBILITY_MAP: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
};
// ✅ Create Donor
export const createDonor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, dateOfBirth, bloodGroup, address, userId } = req.body;

    // Check phone exists
    const exists = await BloodDonor.findOne({ where: { phone } });
    if (exists) {
      return res.status(400).json({ message: "Phone already exists" });
    }

    // Validate phone
    const cleanedPhone = phone.startsWith("0") ? phone.slice(1) : phone;
    if (!/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // validate user exists via API
    try {
      const authHeader = req.headers.authorization;
      const response = await axios.get(`http://user-service:3002/users/${userId}`, {
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      if (!response.data) {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (err: any) {
      if (err.response) {
         if (err.response.status === 404) return res.status(404).json({ message: "User not found" });
         if (err.response.status === 401) return res.status(401).json({ message: "Unauthorized. Please provide a valid token." });
         return res.status(err.response.status).json({ message: err.response.data?.message || "User service error" });
      }
      throw new Error("Failed to validate user from user-service: " + err.message);
    }

    // Check donor already exists for user
    const existingDonor = await BloodDonor.findOne({ where: { userId } });
    if (existingDonor) {
      return res.status(400).json({ message: "Donor already created" });
    }

    // Age validation
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0) age--;

    if (age < 18) {
      return res.status(400).json({
        message: "Must be at least 18",
      });
    }

    const donor = await BloodDonor.create({
      phone: cleanedPhone,
      dateOfBirth,
      bloodGroup,
      address,
      userId,
    } as any);

    return res.status(201).json({
      message: "Donor created",
      donor,
    });
  } catch (error: any) {
    console.error("Create Donor Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// 🔍 Get All Donors (with compatibility filters)
export const getDonors = async (req: Request, res: Response): Promise<any> => {
  try {
    const { bloodGroup, pincode, place } = req.query;

    let where: any = {};

    // 🩸 Apply Smart Compatibility Logic
    if (bloodGroup && typeof bloodGroup === "string") {
      const compatibleGroups = COMPATIBILITY_MAP[bloodGroup.toUpperCase()] || [bloodGroup];
      where.bloodGroup = {
        [Op.in]: compatibleGroups,
      };
    }

    if (pincode) {
      where.address = {
        pincode: pincode,
      };
    }

    const donors = await BloodDonor.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({ donors });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 Get Single Donor
export const getSingleDonor = async (req: Request, res: Response): Promise<any> => {
  try {
    const donor = await BloodDonor.findByPk(req.params.id);

    if (!donor) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(donor);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update
export const updateDonor = async (req: Request, res: Response): Promise<any> => {
  try {
    const donor = await BloodDonor.findByPk(req.params.id);

    if (!donor) {
      return res.status(404).json({ message: "Not found" });
    }

    await donor.update(req.body);

    res.json({ message: "Updated", donor });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Delete
export const deleteDonor = async (req: Request, res: Response): Promise<any> => {
  try {
    const donor = await BloodDonor.findByPk(req.params.id);

    if (!donor) {
      return res.status(404).json({ message: "Not found" });
    }

    await donor.destroy();

    res.json({ message: "Deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
