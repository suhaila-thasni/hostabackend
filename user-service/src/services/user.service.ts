import bcrypt from "bcrypt";
import User from "../models/user.model";
import { generateToken } from "./jwt.service";
import twilio from "twilio";
import { publishEvent } from "../events/publisher";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const APPLE_TEST_NUMBER = "9999999999";
const APPLE_TEST_OTP = "123456";

export const userService = {
  async register(data: any) {
    const exist = await User.findOne({ where: { email: data.email } });
    if (exist) {
      throw { status: 400, message: "User already exists", code: "USER_EXISTS" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      ...data,
      password: hashedPassword,
    });

    const { password: _, ...safeUser } = user.toJSON();
    return safeUser;
  },

  async login(data: any) {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const match = await bcrypt.compare(data.password, user.password || "");
    if (!match) {
      throw { status: 401, message: "Wrong password" };
    }

    const token = generateToken({ id: user.id, email: user.email });
    const { password: _, ...safeUser } = user.toJSON();
    return { token, user: safeUser };
  },

  async loginWithPhone(phone: string) {
    let numericPhone = phone.replace(/\D/g, "").slice(-10);

    if (!numericPhone) {
      throw { status: 400, message: "Invalid phone number" };
    }

    const user = await User.findOne({ where: { phone: numericPhone } });
    if (!user) {
      throw { status: 400, message: "Phone number not registered!" };
    }

    const otp = numericPhone === APPLE_TEST_NUMBER 
      ? APPLE_TEST_OTP 
      : Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 5-minute expiry (Scalable without Redis)
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); 
    await user.save();

    if (numericPhone !== APPLE_TEST_NUMBER) {
        await client.messages.create({
          body: `Your verification code is: ${otp}`,
          from: process.env.TWILIO_NUMBER,
          to: "+91" + numericPhone,
        });
    }

    return { 
        message: numericPhone === APPLE_TEST_NUMBER ? "OTP sent (TEST ACCOUNT)" : "OTP sent successfully", 
        otp: numericPhone === APPLE_TEST_NUMBER ? APPLE_TEST_OTP : undefined 
    };
  },

  async verifyOtp(data: { phone: string; otp: string; FcmToken?: string }) {
    let numericPhone = data.phone.replace(/\D/g, "").slice(-10);

    const user = await User.findOne({ where: { phone: numericPhone } });
    
    if (!user || user.otp !== data.otp.toString()) {
      throw { status: 400, message: "Invalid OTP" };
    }

    // Check expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      throw { status: 400, message: "OTP has expired" };
    }

    // Clear OTP after successful verification
    user.otp = undefined as any;
    user.otpExpiry = undefined as any;

    if (data.FcmToken) {
      user.fcmToken = data.FcmToken;
    }
    
    await user.save();

    const token = generateToken({ id: user.id, email: user.email });
    const userJson = user.toJSON();
    delete (userJson as any).password;
    delete (userJson as any).otp;
    delete (userJson as any).otpExpiry;

    return { token, user: userJson };
  },

  async getAllUsers() {
    return await User.findAll();
  },

  async getUserById(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: "User not found" };
    return user;
  },

  async deleteUser(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: "User not found" };
    
    await user.destroy(); // Soft delete because of paranoid: true
    
    // Broadcast to other services (like blood-service) so they can cleanup too
    await publishEvent('user_events', 'user.deleted', { userId: id });
  },

  async resetPassword(data: any) {
    const user = await User.findByPk(data.id);
    if (!user) throw { status: 404, message: "User not found" };

    if (data.password) {
      const match = await bcrypt.compare(data.password, user.password);
      if (!match) throw { status: 401, message: "Incorrect current password" };
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    await user.save();
  },

  async saveExpoToken(id: string, token: string) {
    const user = await User.findByPk(id);
    if (!user) throw { status: 404, message: "User not found" };

    user.fcmToken = token;
    await user.save();
    return user;
  },

  async testPushNotification(id: string) {
    // In original code, it invoked getIO().emit. In a microservices architecture, this could
    // be published to rabbitmq or pushed directly if web sockets reside here.
    return { message: "Test triggered successfully for user " + id };
  }
};
