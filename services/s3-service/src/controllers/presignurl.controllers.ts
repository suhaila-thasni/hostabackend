// import { Request, Response } from "express";
// import asyncHandler from "express-async-handler";
// import {
//   PutObjectCommand,
//   DeleteObjectCommand,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { v4 as uuidv4 } from "uuid";
// import dotenv from "dotenv";
// import axios from "axios";

// import { S3 } from "../lib/S3Client";

// dotenv.config();

// /* -------------------------------------------------------------------------- */
// /*                                  CONSTANTS                                 */
// /* -------------------------------------------------------------------------- */

// const VALID_ROLES = ["hospital", "user", "doctor", "staff", "ad", "documents", "labresults", "category", "speciality", "device"] as const;

// const SERVICE_CONFIG: Record<
//   string,
//   {
//     baseUrl: string | undefined;
//     endpoint: string;
//   }
// > = {
//   hospital: {
//     baseUrl: process.env.HOSPITAL_SERVICE_URL,
//     endpoint: "hospital",
//   },
//   user: {
//     baseUrl: process.env.USER_SERVICE_URL,
//     endpoint: "users",
//   },
//   doctor: {
//     baseUrl: process.env.DOCTOR_SERVICE_URL,
//     endpoint: "doctor",
//   },
//   staff: {
//     baseUrl: process.env.STAFF_SERVICE_URL,
//     endpoint: "staff",
//   },
//   ad: {
//     baseUrl: process.env.ADS_SERVICE_URL,
//     endpoint: "ads",
//   },
//    speciality: {
//     baseUrl: process.env.SPECIALITY_SERVICE_URL,
//     endpoint: "speciality",
//   },
//     documents: {
//     baseUrl: process.env.USER_SERVICE_URL,
//     endpoint: "documents",
//   },
//     category: {
//     baseUrl: process.env.SPECIALITY_SERVICE_URL,
//     endpoint: "category",
//   },
//     labresults: {
//     baseUrl: process.env.USER_SERVICE_URL,
//     endpoint: "lab-results",
//   },
//   device: {
//     baseUrl: process.env.HOSPITAL_SERVICE_URL,
//     endpoint: "devices",
//   },
// };

// /* -------------------------------------------------------------------------- */
// /*                               HELPER FUNCTION                              */
// /* -------------------------------------------------------------------------- */

// const updateImageUrl = async (
//   role: string,
//   id: string | number,
//   imageUrl: string | null,
//   authorization?: string,
//   type?:string
// ) => {
//   const service = SERVICE_CONFIG[role];

//   if (!service || !service.baseUrl) {
//     throw new Error("Invalid role or missing service URL");
//   }




//   var url: string;



//      if(type == "device_img") {
//          url = `${service.baseUrl}/${service.endpoint}/${id}`;
//       }
//       else if(type == "location_img") {
//          url = `${service.baseUrl}/${service.endpoint}/${id}`;
//       }else{
//        url =  `${service.baseUrl}/${service.endpoint}/${id}`;
//       }

//   // const url = `${service.baseUrl}/${service.endpoint}/${id}`;

//   await axios.put(
//     url,
//     { imageUrl },
//     {
//       headers: {
//         Authorization: authorization || "",
//       },
//     }
//   );
// };

// /* -------------------------------------------------------------------------- */
// /*                            CREATE PRESIGNED URL                            */
// /* -------------------------------------------------------------------------- */

// export const createPresignurl = asyncHandler(
//   async (req: Request, res: Response) : Promise<void> => {
//     try {
//       const { filename, contentType, size, role, id } = req.body;

//       /* ------------------------------ VALIDATION ----------------------------- */

//       if (!filename || !contentType || !size || !role || !id) {
//          res.status(400).json({
//           success: false,
//           message:
//             "filename, contentType, size, role and id are required",
//         });
//         return;
//       }

//       if (!VALID_ROLES.includes(role)) {
//          res.status(400).json({
//           success: false,
//           message: "Invalid role",
//         });
//       }

//       /* ----------------------------- GENERATE KEY ---------------------------- */

//       const uniqueKey = `${uuidv4()}-${filename.replace(/\s/g, "-")}`;

//       /* ------------------------------- S3 COMMAND ---------------------------- */

//       const command = new PutObjectCommand({
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: uniqueKey,
//         ContentType: contentType,
//         ContentLength: Number(size),
//       });

//       /* --------------------------- PRESIGNED URL ----------------------------- */

//       const presignedUrl = await getSignedUrl(S3, command, {
//         expiresIn: 360,
//       });

//       /* --------------------------- UPDATE SERVICE ---------------------------- */

//       await updateImageUrl(
//         role,
//         id,
//         uniqueKey,
//         req.headers.authorization
//       );

//       /* ------------------------------- RESPONSE ------------------------------ */

//      res.status(200).json({
//         success: true,
//         presignedUrl,
//         key: uniqueKey,
//       });
//     } catch (err: any) {
//       console.error("createPresignurl Error:", err);

//       if (err.response) {
//          res.status(err.response.status).json({
//           success: false,
//           message:
//             err.response.data?.message ||
//             "Microservice request failed",
//           error: err.response.data,
//         });
//         return;
//       }

//        res.status(500).json({
//         success: false,
//         message: "Failed to generate upload URL",
//       });
//       return;
//     }
//   }
// );

// /* -------------------------------------------------------------------------- */
// /*                             EDIT PRESIGNED URL                             */
// /* -------------------------------------------------------------------------- */

// export const editAPresignurl = asyncHandler(
//   async (req: Request, res: Response) : Promise<void> => {
//     try {
//       const { filename, contentType, key, role, id } = req.body;

//       /* ------------------------------ VALIDATION ----------------------------- */

//       if (!filename || !contentType || !role || !id) {
//          res.status(400).json({
//           success: false,
//           message:
//             "filename, contentType, role and id are required",
//         });
//         return;
//       }

//       if (!VALID_ROLES.includes(role)) {
//          res.status(400).json({
//           success: false,
//           message: "Invalid role",
//         });
//         return;
//       }

//       /* ------------------------------- OBJECT KEY ---------------------------- */

//       const objectKey =
//         key || `${Date.now()}-${filename.replace(/\s/g, "-")}`;

//       /* ------------------------------- S3 COMMAND ---------------------------- */

//       const command = new PutObjectCommand({
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: objectKey,
//         ContentType: contentType,
//       });

//       /* --------------------------- PRESIGNED URL ----------------------------- */

//       const presignedUrl = await getSignedUrl(S3, command, {
//         expiresIn: 60 * 5,
//       });

//       /* --------------------------- UPDATE SERVICE ---------------------------- */

//       await updateImageUrl(
//         role,
//         id,
//         objectKey,
//         req.headers.authorization
//       );

//       /* ------------------------------- RESPONSE ------------------------------ */

//        res.status(200).json({
//         success: true,
//         presignedUrl,
//         key: objectKey,
//       });
//       return;
//     } catch (err: any) {
//       console.error("editAPresignurl Error:", err);

//       if (err.response) {
//          res.status(err.response.status).json({
//           success: false,
//           message:
//             err.response.data?.message ||
//             "Microservice request failed",
//           error: err.response.data,
//         });
//         return;
//       }

//        res.status(500).json({
//         success: false,
//         message: "Failed to create edit URL",
//       });
//       return;
//     }
//   }
// );

// /* -------------------------------------------------------------------------- */
// /*                           DELETE PRESIGNED URL                             */
// /* -------------------------------------------------------------------------- */

// export const deleteAPresignurl = asyncHandler(
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { key, role, id } = req.body;

//       /* ------------------------------ VALIDATION ----------------------------- */

//       if (!key || typeof key !== "string") {
//          res.status(400).json({
//           success: false,
//           message: "Missing or invalid object key",
//         });
//         return;
//       }

//       if (!role || !id) {
//         res.status(400).json({
//           success: false,
//           message: "role and id are required",
//         });
//         return;
//       }

//       if (!VALID_ROLES.includes(role)) {
//         res.status(400).json({
//           success: false,
//           message: "Invalid role",
//         });
//         return;
//       }

//       /* ------------------------------- DELETE S3 ----------------------------- */

//       const command = new DeleteObjectCommand({
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: key,
//       });

//       await S3.send(command);

//       /* --------------------------- UPDATE SERVICE ---------------------------- */

//       await updateImageUrl(
//         role,
//         id,
//         null,
//         req.headers.authorization
//       );

//       /* ------------------------------- RESPONSE ------------------------------ */

//        res.status(200).json({
//         success: true,
//         message: "File deleted successfully",
//       });
//       return;
//     } catch (err: any) {
//       console.error("deleteAPresignurl Error:", err);

//       if (err.response) {
//          res.status(err.response.status).json({
//           success: false,
//           message:
//             err.response.data?.message ||
//             "Microservice request failed",
//           error: err.response.data,
//         });
//         return;
//       }

//        res.status(500).json({
//         success: false,
//         message: "Failed to delete file",
//       });
//       return;
//     }
//   }
// );






import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import axios from "axios";

import { S3 } from "../lib/S3Client";

dotenv.config();

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

type ImageType = "deviceImage" | "locationImage";

type Role =
  | "hospital"
  | "user"
  | "doctor"
  | "staff"
  | "ad"
  | "documents"
  | "labresults"
  | "category"
  | "speciality"
  | "device";

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const VALID_ROLES: readonly Role[] = [
  "hospital",
  "user",
  "doctor",
  "staff",
  "ad",
  "documents",
  "labresults",
  "category",
  "speciality",
  "device",
];

const SERVICE_CONFIG: Record<
  Role,
  {
    baseUrl: string | undefined;
    endpoint: string;
  }
> = {
  hospital: {
    baseUrl: process.env.HOSPITAL_SERVICE_URL,
    endpoint: "hospital",
  },

  user: {
    baseUrl: process.env.USER_SERVICE_URL,
    endpoint: "users",
  },

  doctor: {
    baseUrl: process.env.DOCTOR_SERVICE_URL,
    endpoint: "doctor",
  },

  staff: {
    baseUrl: process.env.STAFF_SERVICE_URL,
    endpoint: "staff",
  },

  ad: {
    baseUrl: process.env.ADS_SERVICE_URL,
    endpoint: "ads",
  },

  speciality: {
    baseUrl: process.env.SPECIALITY_SERVICE_URL,
    endpoint: "speciality",
  },

  documents: {
    baseUrl: process.env.USER_SERVICE_URL,
    endpoint: "documents",
  },

  category: {
    baseUrl: process.env.SPECIALITY_SERVICE_URL,
    endpoint: "category",
  },

  labresults: {
    baseUrl: process.env.USER_SERVICE_URL,
    endpoint: "lab-results",
  },

  device: {
    baseUrl: process.env.HOSPITAL_SERVICE_URL,
    endpoint: "devices",
  },
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE IMAGE IN SERVICE                            */
/* -------------------------------------------------------------------------- */

const updateImageUrl = async (
  role: Role,
  id: string | number,
  imageKey: string | null,
  imageType?: ImageType,
  authorization?: string
): Promise<void> => {
  const service = SERVICE_CONFIG[role];

  if (!service || !service.baseUrl) {
    throw new Error("Invalid role or missing service URL");
  }

  const url = `${service.baseUrl}/${service.endpoint}/${id}`;
  const payload =
    role === "device" && imageType
      ? { [imageType]: imageKey }
      : { imageUrl: imageKey };

  await axios.put(
    url,
    payload,
    {
      headers: {
        Authorization: authorization || "",
      },
    }
  );
};

/* -------------------------------------------------------------------------- */
/*                         VALIDATE IMAGE TYPE                                */
/* -------------------------------------------------------------------------- */

const isValidImageType = (value: unknown): value is ImageType => {
  return value === "deviceImage" || value === "locationImage";
};

/* -------------------------------------------------------------------------- */
/*                         CREATE PRESIGNED URL                               */
/* -------------------------------------------------------------------------- */

export const createPresignurl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {


     console.log("🔥 NEW PRESIGN CONTROLLER");
  console.log("BODY:", JSON.stringify(req.body, null, 2));

  
    try {
      const { role, id, images, filename, contentType, size, imageType } = req.body;

      /* ------------------------------ VALIDATION ----------------------------- */

      if (!role || !id) {
        res.status(400).json({
          success: false,
          message: "role and id are required",
        });
        return;
      }

      /* ----------------------------- VALIDATE ROLE --------------------------- */

      if (!VALID_ROLES.includes(role as Role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role",
        });
        return;
      }

      /* -------------------------- HANDLE ARRAY MODE ------------------------ */

      if (images && Array.isArray(images)) {
        // Handle multiple images in array format
        if (images.length === 0) {
          res.status(400).json({
            success: false,
            message: "images array cannot be empty",
          });
          return;
        }

        const results = [];

        for (const img of images) {
          const { filename: imgFilename, contentType: imgContentType, size: imgSize, imageType: imgImageType } = img;

          if (!imgFilename || !imgContentType || !imgSize) {
            res.status(400).json({
              success: false,
              message: "Each image must have filename, contentType, and size",
            });
            return;
          }

          if (role === "device" && !imgImageType) {
            res.status(400).json({
              success: false,
              message: "imageType is required for device role",
            });
            return;
          }

          if (role === "device" && !isValidImageType(imgImageType)) {
            res.status(400).json({
              success: false,
              message: "Invalid imageType. Use deviceImage or locationImage",
            });
            return;
          }

          const fileSize = Number(imgSize);
          if (!Number.isFinite(fileSize) || fileSize <= 0) {
            res.status(400).json({
              success: false,
              message: "Invalid file size",
            });
            return;
          }

          const safeFilename = imgFilename
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");

          const uniqueKey =
            role === "device"
              ? `devices/${id}/${imgImageType}/${uuidv4()}-${safeFilename}`
              : `${role}/${id}/${uuidv4()}-${safeFilename}`;

          const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: imgContentType,
            ContentLength: fileSize,
          });

          const presignedUrl = await getSignedUrl(S3, command, {
            expiresIn: 300,
          });

          await updateImageUrl(
            role as Role,
            id,
            uniqueKey,
            imgImageType,
            req.headers.authorization
          );

          results.push({
            imageType: imgImageType,
            presignedUrl,
            key: uniqueKey,
            expiresIn: 300,
          });
        }

        res.status(200).json({
          success: true,
          message: "Presigned URLs created successfully",
          images: results,
        });
        return;
      }

      /* -------------------------- HANDLE SINGLE MODE ------------------------ */

      if (!filename || !contentType || !size) {
        res.status(400).json({
          success: false,
          message: "filename, contentType, and size are required",
        });
        return;
      }

      if (role === "device" && !imageType) {
        res.status(400).json({
          success: false,
          message: "imageType is required for device role",
        });
        return;
      }

      if (role === "device" && !isValidImageType(imageType)) {
        res.status(400).json({
          success: false,
          message: "Invalid imageType. Use deviceImage or locationImage",
        });
        return;
      }

      const fileSize = Number(size);

      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid file size",
        });
        return;
      }

      const safeFilename = filename
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      const uniqueKey =
        role === "device"
          ? `devices/${id}/${imageType}/${uuidv4()}-${safeFilename}`
          : `${role}/${id}/${uuidv4()}-${safeFilename}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueKey,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const presignedUrl = await getSignedUrl(S3, command, {
        expiresIn: 300,
      });

      await updateImageUrl(
        role as Role,
        id,
        uniqueKey,
        imageType,
        req.headers.authorization
      );

      res.status(200).json({
        success: true,
        message: "Presigned URL created successfully",
        presignedUrl,
        key: uniqueKey,
        ...(imageType ? { imageType } : {}),
        expiresIn: 300,
      });

      return;
    } catch (err: any) {
      console.error("createPresignurl Error:", err);

      if (err.response) {
        res.status(err.response.status).json({
          success: false,
          message:
            err.response.data?.message ||
            "Microservice request failed",
          error: err.response.data,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to generate upload URL",
      });

      return;
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                           EDIT PRESIGNED URL                               */
/* -------------------------------------------------------------------------- */

export const editAPresignurl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        filename,
        contentType,
        size,
        key,
        role,
        id,
        imageType,
        images,
      } = req.body;

      /* ------------------------------ VALIDATION ----------------------------- */

      if (!role || !id) {
        res.status(400).json({
          success: false,
          message: "role and id are required",
        });
        return;
      }

      if (!VALID_ROLES.includes(role as Role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role",
        });
        return;
      }

      /* -------------------------- HANDLE ARRAY MODE ------------------------ */

      if (images && Array.isArray(images)) {
        if (images.length === 0) {
          res.status(400).json({
            success: false,
            message: "images array cannot be empty",
          });
          return;
        }

        const results = [];

        for (const img of images) {
          const {
            filename: imgFilename,
            contentType: imgContentType,
            size: imgSize,
            key: imgKey,
            imageType: imgImageType,
          } = img;

          if (!imgFilename || !imgContentType) {
            res.status(400).json({
              success: false,
              message: "Each image must have filename and contentType",
            });
            return;
          }

          if (role === "device" && !imgImageType) {
            res.status(400).json({
              success: false,
              message: "imageType is required for device role",
            });
            return;
          }

          if (role === "device" && !isValidImageType(imgImageType)) {
            res.status(400).json({
              success: false,
              message: "Invalid imageType. Use deviceImage or locationImage",
            });
            return;
          }

          const fileSize = imgSize ? Number(imgSize) : undefined;
          if (
            fileSize !== undefined &&
            (!Number.isFinite(fileSize) || fileSize <= 0)
          ) {
            res.status(400).json({
              success: false,
              message: "Invalid file size",
            });
            return;
          }

          const safeFilename = imgFilename
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");

          const objectKey =
            imgKey ||
            (role === "device"
              ? `devices/${id}/${imgImageType}/${uuidv4()}-${safeFilename}`
              : `${role}/${id}/${uuidv4()}-${safeFilename}`);

          const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: objectKey,
            ContentType: imgContentType,
            ...(fileSize ? { ContentLength: fileSize } : {}),
          });

          const presignedUrl = await getSignedUrl(S3, command, {
            expiresIn: 300,
          });

          await updateImageUrl(
            role as Role,
            id,
            objectKey,
            imgImageType,
            req.headers.authorization
          );

          results.push({
            imageType: imgImageType,
            presignedUrl,
            key: objectKey,
            expiresIn: 300,
          });
        }

        res.status(200).json({
          success: true,
          message: "Edit presigned URLs created successfully",
          images: results,
        });
        return;
      }

      /* -------------------------- HANDLE SINGLE MODE ------------------------ */

      if (
        !filename ||
        !contentType ||
        (role === "device" && !imageType)
      ) {
        res.status(400).json({
          success: false,
          message:
            role === "device"
              ? "filename, contentType, role, id and imageType are required"
              : "filename, contentType, role and id are required",
        });
        return;
      }

      if (role === "device" && !isValidImageType(imageType)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid imageType. Use deviceImage or locationImage",
        });
        return;
      }

      /* ---------------------------- FILE SIZE ------------------------------- */

      const fileSize = size ? Number(size) : undefined;

      if (
        fileSize !== undefined &&
        (!Number.isFinite(fileSize) || fileSize <= 0)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid file size",
        });
        return;
      }

      /* ----------------------------- OBJECT KEY ------------------------------ */

      const safeFilename = filename
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      const objectKey =
        key ||
        (role === "device"
          ? `devices/${id}/${imageType}/${uuidv4()}-${safeFilename}`
          : `${role}/${id}/${uuidv4()}-${safeFilename}`);

      /* ----------------------------- S3 COMMAND ------------------------------ */

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
        ...(fileSize
          ? {
            ContentLength: fileSize,
          }
          : {}),
      });

      /* --------------------------- PRESIGNED URL ----------------------------- */

      const presignedUrl = await getSignedUrl(S3, command, {
        expiresIn: 300,
      });

      /* --------------------------- UPDATE SERVICE ---------------------------- */

      await updateImageUrl(
        role as Role,
        id,
        objectKey,
        imageType,
        req.headers.authorization
      );

      /* ------------------------------- RESPONSE ------------------------------ */

      res.status(200).json({
        success: true,
        message: "Edit presigned URL created successfully",
        presignedUrl,
        key: objectKey,
        ...(imageType ? { imageType } : {}),
        expiresIn: 300,
      });

      return;
    } catch (err: any) {
      console.error("editAPresignurl Error:", err);

      if (err.response) {
        res.status(err.response.status).json({
          success: false,
          message:
            err.response.data?.message ||
            "Microservice request failed",
          error: err.response.data,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to create edit URL",
      });

      return;
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                           DELETE IMAGE                                     */
/* -------------------------------------------------------------------------- */

export const deleteAPresignurl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        key,
        role,
        id,
        imageType,
      } = req.body;

      /* ------------------------------ VALIDATION ----------------------------- */

      if (!key || typeof key !== "string") {
        res.status(400).json({
          success: false,
          message: "Missing or invalid object key",
        });
        return;
      }

      if (!role || !id || (role === "device" && !imageType)) {
        res.status(400).json({
          success: false,
          message:
            role === "device"
              ? "role, id and imageType are required"
              : "role and id are required",
        });
        return;
      }

      if (!VALID_ROLES.includes(role as Role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role",
        });
        return;
      }

      if (role === "device" && !isValidImageType(imageType)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid imageType. Use deviceImage or locationImage",
        });
        return;
      }

      /* ------------------------------- DELETE S3 ----------------------------- */

      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });

      await S3.send(command);

      /* --------------------------- UPDATE SERVICE ---------------------------- */

      await updateImageUrl(
        role as Role,
        id,
        null,
        imageType,
        req.headers.authorization
      );

      /* ------------------------------- RESPONSE ------------------------------ */

      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });

      return;
    } catch (err: any) {
      console.error("deleteAPresignurl Error:", err);

      if (err.response) {
        res.status(err.response.status).json({
          success: false,
          message:
            err.response.data?.message ||
            "Microservice request failed",
          error: err.response.data,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete file",
      });

      return;
    }
  }
);
