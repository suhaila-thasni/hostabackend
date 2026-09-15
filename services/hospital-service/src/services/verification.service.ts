import axios from "axios";
import fs from "fs";
import path from "path";

// Polyfill for face-api.js browser build running in Node
import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";

// Monkey patch face-api to work in NodeJS
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
  createCanvasElement: () => new Canvas(800, 600) as any
});

export class VerificationService {
  private static STAFF_SERVICE_URL = process.env.STAFF_SERVICE_URL || "http://staff-service:3006";
  private static DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007";
  private isModelsLoaded = false;
  private modelLoadPromise: Promise<void>;

  constructor() {
    this.modelLoadPromise = this.loadModels();
  }

  private async loadModels() {
    try {
      const tf = (faceapi as any).tf;
      if (tf?.ready) {
        await tf.ready();
      }

      // Resolves to hospital-service/models
      const modelsPath = path.join(__dirname, "../../models");

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

      this.isModelsLoaded = true;
      console.log("[Face-Verification] Models loaded successfully.");
    } catch (err) {
      console.error("[Face-Verification] Failed to load models:", err);
    }
  }

  /**
   * Verifies if the captured image matches the staff's/doctor's reference image
   * @param roleId The ID of the user (roleId)
   * @param capturedImage Base64 or URL of the captured selfie
   * @param roles Array of roles assigned to the user
   * @returns Promise<{ success: boolean; message: string }>
   */
  public async verifyFace(roleId: number, capturedImage: string, roles: any = []): Promise<{ success: boolean; message: string }> {
    try {
      if (!roleId) {
        return { success: false, message: "Face verification failed: roleId (User/Doctor ID) is missing in request." };
      }
      if (!capturedImage) {
        return { success: false, message: "Face verification failed: No selfie image was provided in the request." };
      }

      await this.modelLoadPromise;
      
      let referenceImage: string | undefined = undefined;
      
      // Handle cases where roles might be a string, an array of strings, or an array of objects
      let isDoctor = false;
      if (typeof roles === 'string') {
        isDoctor = roles.toLowerCase() === 'doctor';
      } else if (Array.isArray(roles)) {
        isDoctor = roles.some((r: any) => {
          if (typeof r === 'string') return r.toLowerCase() === 'doctor';
          if (r && typeof r === 'object' && r.name) return r.name.toLowerCase() === 'doctor';
          return false;
        });
      }

      if (isDoctor) {
        // Fetch doctor reference image from Doctor Service
        const doctorUrl = `${VerificationService.DOCTOR_SERVICE_URL}/doctor/${roleId}`;
        const doctorResponse = await axios.get(doctorUrl, { validateStatus: () => true });

        if (doctorResponse.status !== 200 || !doctorResponse.data?.success) {
          console.error(`[Face-Verification] Doctor service fetch failed (${doctorUrl}):`, doctorResponse.status, doctorResponse.data);
          const errMsg = doctorResponse.data?.message || `HTTP ${doctorResponse.status}`;
          return { success: false, message: `Could not fetch doctor details for verification: ${errMsg}` };
        }

        referenceImage = doctorResponse.data.data?.imageUrl;
      } else {
        // Fetch staff reference image from Staff Service (try /staff/:id first, then /staffs/:id/details)
        let staffResponse = await axios.get(`${VerificationService.STAFF_SERVICE_URL}/staff/${roleId}`, {
          validateStatus: () => true
        });

        if (staffResponse.status !== 200 || !staffResponse.data?.success) {
          staffResponse = await axios.get(`${VerificationService.STAFF_SERVICE_URL}/staffs/${roleId}/details`, {
            validateStatus: () => true
          });
        }

        if (staffResponse.status !== 200 || !staffResponse.data?.success) {
          console.error("[Face-Verification] Staff service fetch failed:", staffResponse.status, staffResponse.data);
          const errMsg = staffResponse.data?.message || `HTTP ${staffResponse.status}`;
          return { success: false, message: `Could not fetch staff details for verification: ${errMsg}` };
        }

        referenceImage = staffResponse.data.data?.imageUrl || staffResponse.data.imageUrl;
      }

      if (!referenceImage) {
        return { success: false, message: "No reference image found in your profile. Please update the profile photo first." };
      }

      const FACE_MATCH_THRESHOLD = 0.45;

      const isMatch = await this.compareFaces(referenceImage, capturedImage, FACE_MATCH_THRESHOLD);

      if (!isMatch.success) {
        return { success: false, message: isMatch.message };
      }

      return { success: true, message: "Face verified successfully." };
    } catch (error: any) {
      console.error("[Face-Verification-Error]:", error);
      return { success: false, message: "Verification service error: " + error.message };
    }
  }

  private async compareFaces(refImgStr: string, capImgStr: string, threshold: number): Promise<{ success: boolean; message: string }> {
    if (!this.isModelsLoaded) {
      console.error("[Face-Verification] CRITICAL: Models failed to load. Rejecting attendance.");
      return { success: false, message: "Face verification is unavailable: AI models could not be loaded. Contact administrator." };
    }

    try {
      const refImg = await this.loadImageFromString(refImgStr);
      const capImg = await this.loadImageFromString(capImgStr);

      if (!refImg || !capImg) {
        return { success: false, message: "Face verification failed: Could not parse one or both image files." };
      }

      const refDetection = await faceapi.detectSingleFace(refImg as any).withFaceLandmarks().withFaceDescriptor();
      const capDetection = await faceapi.detectSingleFace(capImg as any).withFaceLandmarks().withFaceDescriptor();

      if (!refDetection) {
        return { success: false, message: "Face verification failed: NO FACE DETECTED in the Staff's Profile Image stored in the database." };
      }
      if (!capDetection) {
        return { success: false, message: "Face verification failed: NO FACE DETECTED in the selfie you just uploaded." };
      }

      const distance = faceapi.euclideanDistance(refDetection.descriptor, capDetection.descriptor);
      
      if (distance >= threshold) {
        return { 
          success: false, 
          message: `Face verification failed: Identity mismatch. The uploaded selfie does not mathematically match the database profile photo.` 
        };
      }

      return { success: true, message: "Match verified" }; 
    } catch (error) {
      console.error("[Face-Verification-Error] Comparison failed:", error);
      return { success: false, message: "An internal server error occurred during Tensor computation." };
    }
  }

  private async loadImageFromString(imgStr: string): Promise<Image | null> {
    try {
      if (!imgStr) return null;

      if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
        const response = await axios.get(imgStr, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          validateStatus: (status) => status === 200,
        });
        if (!response.data || response.data.byteLength === 0) {
          console.error(`[Face-Verification] Image URL returned empty data: ${imgStr}`);
          return null;
        }
        return await loadImage(Buffer.from(response.data));
      }
      if (imgStr.startsWith("data:image")) {
        return await loadImage(imgStr);
      }
      if (imgStr.startsWith("/")) {
        // Resolve absolute paths by looking from the root uploads directory
        const absolutePath = path.join(__dirname, "../../../", imgStr);
        if (fs.existsSync(absolutePath)) {
          return await loadImage(absolutePath);
        }
        const servicePath = path.join(__dirname, "../../", imgStr);
        if (fs.existsSync(servicePath)) {
          return await loadImage(servicePath);
        }
      }

      const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
      return await loadImage(Buffer.from(base64Data, "base64"));
    } catch (e: any) {
      console.error(`[Face-Verification] Image load error for (${imgStr.substring(0, 60)}...):`, e?.message || e);
      return null;
    }
  }
}

export const verificationService = new VerificationService();
