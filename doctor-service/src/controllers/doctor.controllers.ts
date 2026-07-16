import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Doctor from "../models/doctor.model";
import { publishEvent } from "../events/publisher";
import { Op, Sequelize } from "sequelize";
import twilio from "twilio";
import axios from "axios";
import { sendEmail } from "../services/mail.service";
import dotenv from "dotenv";
dotenv.config();



interface FCMTOKEN {
  deviceId: string;
  fcmToken: string;
  platform: "android" | "ios" | "web";
}


// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 2 weeks
    path: "/",
  });
};

// Helper for Twilio Client
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return null;
  }
  return twilio(sid, token);
};

export const sendDoctorOtpEmail = async (
  email: string,
  otp: string,
  doctorName: string,
) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #17a2b8; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Hosta Doctor</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello <strong>Dr. ${doctorName}</strong>,</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the following security code to complete your verification. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background-color: #f8f9fa; border: 2px dashed #17a2b8; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: bold; color: #17a2b8; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.5; border-top: 1px solid #eee; pt: 20px;">
          If you didn't request this, please ignore this email or contact support if you have concerns.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        &copy; 2026 Hosta Health. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail(email, "Your Verification Code - Hosta Doctor", html);
};

// REGISTER - POST /doctor/register
export const Registeration: any = asyncHandler(
  async (req: any, res: Response) => {
    const {
      hospitalId,
      firstName,
      lastName,
      phone,
      joiningDate,
      email,
      password,
      roleId,
      fees,
      department,
      specialist,
      dob,
      gender,
      knowLanguages,
      consultingTwo,
      consultingOne,
      bookingOpen,
      qualification,
      address,
      displayName,
      outDoorConsulting,
      experience,
      appointmentCount,
      regNo,
      hospitalName,
    } = req.body;


    if (!hospitalId) {
      res
        .status(400)
        .json({ success: false, message: "Hospital ID is required" });
      return;
    }

    // 2. Validate hospitalId via hospital-service
    try {
      const hospitalResponse = await axios.get(
        `${process.env.HOSPITAL_SERVICE_URL}/hospital/${hospitalId}`,
        {
          headers: { Authorization: req.headers.authorization },
        },
      );
      if (!hospitalResponse.data || !hospitalResponse.data.success) {
        res
          .status(400)
          .json({ success: false, message: "Invalid hospital ID" });
        return;
      }
    } catch (error) {
      res.status(404).json({
        success: false,
        message: `Hospital with ID ${hospitalId} does not exist in the hospital service.`,
        error: { code: "HOSPITAL_NOT_FOUND" },
      });
      return;
    }

    const numericPhone = phone.replace(/\D/g, "").slice(-10);
 const exist = await Doctor.findOne({
  where: {
    phone: numericPhone,
    hospitalId: hospitalId,
  },

});

if (exist) {
  res.status(409).json({
    success: false,
    message: "Doctor already exists in this hospital",
    data: null,
    error: { code: "DOCTOR_ALREADY_EXISTS", details: null },
  });
  return;
}

    const newDoctor = await Doctor.create({
      firstName,
      lastName,
      phone: numericPhone,
      email,
      password,
      roleId,
      fees,
      department,
      specialist,
      dob,
      gender,
      knowLanguages,
      consultingTwo,
      consultingOne,
      bookingOpen,
      qualification,
      address,
      displayName,
      joiningDate,
      outDoorConsulting,
      hospitalId,
      experience,
      appointmentCount,
      regNo,
      hospitalName,
    });




 try {
   await axios.post(
    `${process.env.AUTH_SERVICE_URL}/auth`,
    {
      email,
      phone,
      password,
      role: "doctor",
      doctorId: newDoctor.id,
    }
  );

} catch (error: any) {
  console.error(
    "Failed to create auth doctor:",
    error.response?.data || error.message
  );

  throw new Error("Failed to create authentication doctor");
}


    await publishEvent("doctor_events", "DOCTOR_REGISTERED", {
      doctorId: newDoctor.id,
      doctorName: newDoctor.displayName,
      phone: newDoctor.phone,
      hospitalId: newDoctor.hospitalId,
    });

    res.status(201).json({
      success: true,
      message: "Registeration completed successfully",
      data: null,
      error: null,
    });
  },
);

// LOGIN - POST /doctor/login


export const login: any = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, phone, password, fcmToken, hospitalId } = req.body;
    

    if ((!email && !phone) || !password) {
      res.status(400).json({
        success: false,
        message: "Identifier and password required",
      });
      return;
    }

    const doctors = await Doctor.scope("withPassword").findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              email ? { email } : null,
              phone ? { phone } : null,
            ].filter(Boolean),
          },

          ...(hospitalId ? [{ hospitalId }] : []),
        ],
      },
    });

    

    if (!doctors.length) {
      res.status(401).json({
        success: false,
        message: "Doctor not found",
      });

      return;
    }

    const matchedDoctors = [];

    for (const doctor of doctors) {
      const valid = await bcrypt.compare(password, doctor.password || "");

      if (valid) {
        matchedDoctors.push(doctor);
      }
    }

    if (!matchedDoctors.length) {
      res.status(401).json({
        success: false,
        message: "Wrong password",
      });

      return;
    }

    if (matchedDoctors.length > 1 && !hospitalId) {
      
      res.status(200).json({
        success: true,

        requireHospitalSelection: true,

        hospitals: matchedDoctors.map((d) => ({
          doctorId: d.id,

          hospitalId: d.hospitalId,

          hospitalName: d.hospitalName,
        })),
      });

      return;
    }

    const doctor = matchedDoctors[0];





if (fcmToken) {
  const doctor = await Doctor.findOne({
    where: { email },
  });

  if (doctor) {
    const existingTokens: FCMTOKEN[] = Array.isArray(doctor.fcmToken)
      ? doctor.fcmToken
      : [];

    // Convert single object to array
    const newTokens: FCMTOKEN[] = Array.isArray(fcmToken)
      ? fcmToken
      : [fcmToken];

    const updatedTokens = [
      // Remove old token for same device
      ...existingTokens.filter(
        (oldToken) =>
          !newTokens.some(
            (newToken) =>
              newToken.deviceId === oldToken.deviceId
          )
      ),

      // Add new tokens
      ...newTokens,
    ];

    await doctor.update({
      fcmToken: updatedTokens,
    });

  }
}
      


 
    const jwtKey = process.env.JWT_SECRET!;

    const token = jwt.sign(
      {
        id: doctor.id,
        role: "doctor",
        roleId: doctor.roleId,
        hospitalId: doctor.hospitalId,
      },
      jwtKey,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: doctor.id,
        isRefresh: true,
      },
      jwtKey,
      {
        expiresIn: "2w",
      },
    );

    setRefreshTokenCookie(res, refreshToken);

    const {
      password: _,
      otp: __,
      otpExpiry: ___,
      ...safeDoctor
    } = doctor.get();



let authPermission = [];

if (doctor.roleId) {
  try {
    const res = await axios.get(
      `${process.env.ROLE_SERVICE_URL}/rolepermission`,
      {
        params: {
          roleId: doctor.roleId,
          hospitalId: doctor.hospitalId,
        },
      }
    );

    authPermission = res.data;
  } catch (err: any) {
    console.error("Role service failed:", err.response?.status);
    authPermission = [];
  }
}

   if(safeDoctor.isDelete === true) {
       res.status(401).json({
      success: false,
      message: "You'r account has been deactivated.",
      data: null,
      error: { code: "DOCTOR_BLACKLISTED", details: null },
    });
    return;
    }


    res.status(200).json({
  success: true,
  message: "Logged in successfully",
  status: 200,
  token,
  data: safeDoctor,
  error: null,
  authDefaultPermission: 1,
  authPermission, 

});

  },
);

// LOGIN WITH PHONE (OTP REQUEST) - POST /doctor/login/phone
export const loginWithPhone: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone } = req.body;
    const numericPhone = phone.replace(/\D/g, "").slice(-10);
    const doctor = await Doctor.findOne({
      where: { phone: numericPhone, isDelete: false },
    });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found with this phone number",
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    await Doctor.update({ otp, otpExpiry }, { where: { phone: numericPhone } });

    // Send OTP via Twilio
    const client = getTwilioClient();
    const twilioNumber = process.env.TWILIO_NUMBER;

    if (client && twilioNumber) {
      try {
        const targetNumber = phone.startsWith("+")
          ? phone
          : `+91${numericPhone}`;
        await client.messages.create({
          body: `Your Hosta Doctor verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioNumber,
          to: targetNumber,
        });
      } catch (err: any) {
        console.error("Twilio Error:", err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
      data: process.env.NODE_ENV === "development" ? { otp } : null,
    });
  },
);

// VERIFY OTP - POST /doctor/otp

export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp, fcmToken } = req.body;

    let numericPhone = phone.replace(/\D/g, "").slice(-10);
    const doctor = await Doctor.scope("withPassword").findOne({
      where: { phone: numericPhone },
    });


  // Persist FCM token if provided, then clear OTPs
  if (fcmToken) {
    await doctor.update({ fcmToken, otp: null, otpExpiry: null });
  } else {
    await doctor.update({ otp: null, otpExpiry: null });
  }


    // Clear OTP fields after verification
    await doctor.update({ otp: null, otpExpiry: null });

    const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
    const token = jwt.sign(
      {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        role: "doctor",
        roleId: doctor.roleId,
        isRefresh: false,
      },
      jwtKey,
      {
        expiresIn: "15m",
      },
    );

    const {
      password: _,
      otp: __,
      otpExpiry: ___,
      ...safeDoctor
    } = doctor.get();

    const refreshToken = jwt.sign(
      {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        role: "doctor",
        roleId: doctor.roleId,
        isRefresh: true,
      },
      jwtKey,
      {
        expiresIn: "2w",
      },
    );

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      data: safeDoctor,
    });
  },
);

// GET ONE - GET /doctor/:id
export const getanDoctor: any = asyncHandler(
  async (req: Request, res: Response) => {
    const doctor = await Doctor.findOne({
      where: { id: req.params.id, isDelete: false },
    });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
        data: null,
        error: { code: "DOCTOR_NOT_FOUND", details: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: "Success",
      data: doctor,
      error: null,
    });
  },
);

// UPDATE - PUT /doctor/:id
export const updateData: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatePayload = req.body;

    const doctor = await Doctor.update(updatePayload, {
      where: { id: id, isDelete: false },
      returning: true,
      individualHooks: true, // 🔥 Ensure password hashing hooks are triggered
    });

    if (!doctor[1] || doctor[1].length === 0) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
        status: 200,
        data: null,
        error: { code: "DOCTOR_NOT_FOUND", details: null },
      });
      return;
    }


      // update auth doctor

   try {
   await axios.put(
    `${process.env.AUTH_SERVICE_URL}/auth/${doctor[1][0].id}/role/${"doctor"}`,
    {
     updatePayload
    }
  );

} catch (error: any) {
  console.error(
    "Failed to update auth doctor:",
    error.response?.data || error.message
  );

  throw new Error("Failed to update authentication doctor");
}

    await publishEvent("doctor_events", "DOCTOR_UPDATED", {
      doctorId: doctor[1][0].id,
    });

    res.status(200).json({
      success: true,
      message: "successfully updated",
      data: doctor[1][0],
      error: null,
    });
  },
);

// DELETE - DELETE /doctor/:id
export const doctorDelete: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const doctor = await Doctor.findOne({ where: { id, isDelete: false } });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
        data: null,
        error: { code: "DOCTOR_NOT_FOUND", details: null },
      });
      return;
    }

    // 🔥 Move to blacklist (soft delete)
    await doctor.update({
      isActive: false,
      isDelete: true,
      deleteDate: new Date(),
    });


      // update auth doctor

   try {
   await axios.put(
    `${process.env.AUTH_SERVICE_URL}/auth/${id}/role/${"doctor"}`,
    {
      isActive: false,
      isDelete: true,
      deleteDate: new Date(),
    }
  );

} catch (error: any) {
  console.error(
    "Failed to update auth doctor:",
    error.response?.data || error.message
  );

  throw new Error("Failed to update authentication doctor");
}

    await publishEvent("doctor_events", "DOCTOR_DELETED", {
      doctorId: id,
    });

    res.status(200).json({
      success: true,
      message: "Doctor account moved to blacklist.",
      status: 200,
      data: null,
      error: null,
    });
  },
);

// GET ALL - GET /doctor
export const getDoctors = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const normalizeQuery = (value: any) =>
      Array.isArray(value) ? value[0] : value;

    let {
      hospitalId,
      speciality,
      name,
      status,
      search_query,
      page = 1,
      limit = 10,
    }: any = req.query;

    hospitalId = normalizeQuery(hospitalId);
    speciality = normalizeQuery(speciality);
    name = normalizeQuery(name);
    status = normalizeQuery(status);
    search_query = normalizeQuery(search_query);
    page = normalizeQuery(page);
    limit = normalizeQuery(limit);

    const whereClause: any = {};
    const andConditions: any[] = [];

    /* ------------------------------ PAGINATION ----------------------------- */

    const pageNum = Math.max(Number(page) || 1, 1);

    // max 100 limit protection
    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 100);

    /* ---------------------------- FILTERS -------------------------------- */

    if (hospitalId) {
      andConditions.push({
        hospitalId: Number(hospitalId),
      });
    }

    if (status !== undefined) {
      andConditions.push({
        isActive: status === "true",
      });
    }

    if (name) {
      andConditions.push({
        displayName: {
          [Op.iLike]: `%${name}%`,
        },
      });
    }

    if (speciality) {
      andConditions.push({
        department: {
          [Op.iLike]: `%${speciality}%`,
        },
      });
    }

    /* -------------------------- SEARCH QUERY ------------------------------ */

    if (search_query?.trim()) {
      const search = search_query.trim();

      andConditions.push({
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn("COALESCE", Sequelize.col("displayName"), ""),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),

          Sequelize.where(
            Sequelize.fn("COALESCE", Sequelize.col("email"), ""),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),

          Sequelize.where(
            Sequelize.fn("COALESCE", Sequelize.col("phone"), ""),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),

            Sequelize.where(
            Sequelize.fn("COALESCE", Sequelize.col("hospitalName"), ""),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),



          Sequelize.where(
            Sequelize.fn("COALESCE", Sequelize.col("department"), ""),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),

          Sequelize.where(Sequelize.cast(Sequelize.col("gender"), "TEXT"), {
            [Op.iLike]: `%${search}%`,
          }),
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause[Op.and] = andConditions;
    }

    /* ----------------------------- QUERY -------------------------------- */

    const doctors = await Doctor.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      order: [["createdAt", "DESC"]],
    });

    /* --------------------------- PAGINATION ------------------------------- */

    const totalPages = Math.ceil(doctors.count / limitNum) || 1;

    /* ----------------------------- RESPONSE ------------------------------- */

    res.status(200).json({
      success: true,
      data: doctors.rows,
      pagination: {
        totalItems: doctors.count,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      error: null,
    });
    return;
  },
);

// GET BLACKLISTED - GET /doctor/blacklist
export const getBlacklistedDoctors: any = asyncHandler(
  async (req: Request, res: Response) => {
    const doctor = await Doctor.findAll({
      where: { isDelete: true },
    });

    if (doctor.length === 0) {
      res.status(404).json({
        success: false,
        message: "No blacklisted doctors found",
        data: null,
        error: { code: "NO_DATA_FOUND", details: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: "Success",
      data: doctor,
      error: null,
    });
  },
);


// RECOVER FROM BLACKLIST - PUT /doctor/recover/:id
export const recoverDoctor: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const doctor = await Doctor.findOne({
    where: {
      id,
      isDelete: true,
    },
  });

  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Blacklisted doctor not found",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  await doctor.update({
    isDelete: false,
    isActive: true,
    deleteDate: null,
  });


   try {
   await axios.put(
    `${process.env.AUTH_SERVICE_URL}/auth/${doctor.id}/role/${"doctor"}`,
    {
      isActive: true,
      isDelete: false,
      deleteDate: null,
    }
  );

} catch (error: any) {
  console.error(
    "Failed to update auth doctor:",
    error.response?.data || error.message
  );

  throw new Error("Failed to update authentication doctor");
}


  await publishEvent("doctor_events", "DOCTOR_RECOVERED", {
    doctorId: doctor.id,
    doctorName: doctor.displayName,
  });

  res.status(200).json({
    success: true,
    message: "Doctor recovered successfully",
    data: doctor,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /doctor/password
export const changepassword: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword, email } = req.body;

    const doctor = await Doctor.scope("withPassword").findOne({
      where: { email, isDelete: false },
    });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      doctor.password || "",
    );
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Incorrect current password",
      });
      return;
    }

    // Set raw password; model hook handles hashing
    doctor.password = newPassword;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

// SEND DOCTOR OTP (EMAIL) - POST /doctor/auth/send-otp
export const sendDoctorOtp: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const doctor = await Doctor.findOne({ where: { email, isDelete: false } });
    if (!doctor) {
      res
        .status(404)
        .json({ success: false, message: "Doctor not found with this email" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await doctor.update({ otp, otpExpiry });

    try {
      await sendDoctorOtpEmail(
        email,
        otp,
        `${doctor.firstName} ${doctor.lastName}`,
      );
      res.json({ success: true, message: "OTP sent to email" });
      return;
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to send email" });
      return;
    }
  },
);

// VERIFY DOCTOR OTP - POST /doctor/auth/verify-otp
export const verifyDoctorOtp: any = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, email, otp } = req.body;

    if ((!phone && !email) || !otp) {
      res
        .status(400)
        .json({
          success: false,
          message: "Identifier (phone/email) and OTP are required",
        });
      return;
    }

    let doctor;
    if (phone) {
      let numericPhone = phone.replace(/\D/g, "").slice(-10);
      doctor = await Doctor.scope("withPassword").findOne({
        where: { phone: numericPhone, isDelete: false },
      });
    } else if (email) {
      doctor = await Doctor.scope("withPassword").findOne({
        where: { email, isDelete: false },
      });
    }

    if (!doctor || doctor.otp !== otp.toString()) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    if (doctor.otpExpiry && new Date() > doctor.otpExpiry) {
      res.status(400).json({ success: false, message: "OTP has expired" });
      return;
    }

    // Clear OTP after successful verification
    await doctor.update({ otp: null, otpExpiry: null });

    const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
    const token = jwt.sign(
      {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        role: "doctor",
        roleId: doctor.roleId,
        isRefresh: false,
      },
      jwtKey,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        role: "doctor",
        roleId: doctor.roleId,
        isRefresh: true,
      },
      jwtKey,
      {
        expiresIn: "2w",
      },
    );

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "OTP verified",
      token,
      data: doctor,
    });
  },
);

// RESET DOCTOR PASSWORD - POST /doctor/auth/reset-password
export const resetDoctorPassword: any = asyncHandler(
  async (req: any, res: Response) => {
    const { email,newPassword } = req.body;

    const doctor = await Doctor.scope("withPassword").findOne({
      where: { email },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    doctor.password = newPassword;
    doctor.otp = null as any;
    doctor.otpExpiry = null as any;

    await doctor.save();

    // Notify hospital about password reset
    await publishEvent("doctor_events", "DOCTOR_PASSWORD_RESET", {
      doctorId: doctor.id,
      doctorName: doctor.displayName,
      hospitalId: doctor.hospitalId,
    });

    res.json({ success: true, message: "Password reset successful" });
  },
);

// CHANGE DOCTOR PASSWORD (JWT) - PUT /doctor/auth/change-password
export const changeDoctorPassword: any = asyncHandler(
  async (req: any, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const doctor = await Doctor.scope("withPassword").findOne({
      where: { id: req.user.id, isDelete: false },
    });
    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      doctor.password || "",
    );
    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, message: "Incorrect current password" });
      return;
    }

    doctor.password = newPassword;
    await doctor.save();

    // Notify hospital about password change
    await publishEvent("doctor_events", "DOCTOR_PASSWORD_CHANGED", {
      doctorId: doctor.id,
      doctorName: doctor.displayName,
      hospitalId: doctor.hospitalId,
    });

    res.json({ success: true, message: "Password changed successfully" });
  },
);

// REFRESH TOKEN - POST /doctor/refresh
export const refreshDoctorToken: any = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res
        .status(401)
        .json({ success: false, message: "Refresh token missing" });
      return;
    }

    const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

    try {
      const decoded: any = jwt.verify(refreshToken, jwtKey);

      // Check Redis Blacklist / Rotation (REMOVED)

      const doctor = await Doctor.findByPk(decoded.id);

      if (!doctor) {
        res
          .status(401)
          .json({ success: false, message: "Invalid refresh token" });
        return;
      }

      const newToken = jwt.sign(
        {
          id: doctor.id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          role: "doctor",
          roleId: doctor.roleId,
          isRefresh: false,
        },
        jwtKey,
        {
          expiresIn: "15m",
        },
      );

      res.status(200).json({
        success: true,
        token: newToken,
      });
    } catch (error) {
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }
  },
);

// LOGOUT - POST /doctor/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {


const { deviceId } = req.body;

const doctor = await Doctor.findByPk(req.params.id);

if (!doctor) {
   res.status(404).json({
    success: false,
    message: "Doctor not found",
  });
  return;
}

doctor.fcmToken = doctor.fcmToken.filter(
  (device: any) => device.deviceId !== deviceId
);

await doctor.save();

  // Redis Blacklist (REMOVED)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// SAVE FCM TOKEN - POST /doctor/:id/fcm-token
export const saveFcmToken: any = asyncHandler(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;
  const { id } = req.params;

  if (!fcmToken) {
    res.status(400).json({
      success: false,
      message: "FCM token is required",
      error: { code: "MISSING_FCM_TOKEN", details: null },
    });
    return;
  }

  const doctor = await Doctor.findByPk(id);
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  await doctor.update({ fcmToken });

  res.status(200).json({
    success: true,
    message: "FCM token saved successfully",
    data: { id: doctor.id, fcmToken: doctor.fcmToken },
    error: null,
  });
});
