import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { S3 } from "../lib/S3Client";
dotenv.config();





export const createPresignurl: any = asyncHandler(async (req: Request, res: Response) : Promise<void> => {

  try {
    const { filename, contentType, size } = req.body;

    if (!filename || !contentType || !size) {
       res.status(400).json({ error: "Invalid request body" });
    }

    const uniqueKey = `${uuidv4()}-${filename}`;

    

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });



    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360,
    });

    res.json({
      presignedUrl,
      key: uniqueKey,
    });

    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }




  });








export const editAPresignurl: any = asyncHandler(async (req: Request, res: Response) : Promise<void> => {

  try {
    // ✅ Express way
    const { filename, contentType, key } = req.body;

    if (!filename || !contentType) {
       res.status(400).json({
        error: "Missing filename or contentType",
      });
    }

    // reuse key OR create new
    const objectKey =
      key || `${Date.now()}-${filename.replace(/\s/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 60 * 5,
    });

     res.json({
      presignedUrl,
      key: objectKey,
    });

  } catch (err) {
    console.error(err);

   res.status(500).json({
      error: "Failed to create edit URL",
    });
  }


});



export const deleteAPresignurl: any = asyncHandler(async (req: Request, res: Response) : Promise<void> => {
  
  try {
    // ✅ Express way
    const { key } = req.body;

    if (!key || typeof key !== "string") {
       res.status(400).json({
        error: "Missing or invalid object key.",
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    await S3.send(command);

     res.status(200).json({
      message: "File deleted successfully",
    });

  } catch (err) {
    console.error(err);

     res.status(500).json({
      error: "Failed to delete file.",
    });
  }

  
});






