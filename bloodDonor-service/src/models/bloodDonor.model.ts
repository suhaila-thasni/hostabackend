import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IBloodDonor {
  id?: number;
  donorId?: string; // Virtual ID
  phone: string;
  userId: number;
  dateOfBirth: Date;
  bloodGroup: string;
  address: {
    country?: string;
    state?: string;
    district?: string;
    place: string;
    pincode: number;
  };
  otp?: string;
  otpExpiry?: Date;
  deletedAt?: Date;
  roleId?: number;
}

class BloodDonor extends Model<IBloodDonor> implements IBloodDonor {
  public id!: number;
  public readonly donorId!: string;
  public phone!: string;
  public userId!: number;
  public dateOfBirth!: Date;
  public bloodGroup!: string;
  public address!: any;
  public otp?: string;
  public otpExpiry?: Date;
  public readonly deletedAt!: Date;
  public roleId!: number;
}

BloodDonor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    donorId: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue("id");
        return `#DON${String(id).padStart(5, "0")}`;
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bloodGroup: {
      type: DataTypes.ENUM("O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"),
      allowNull: false,
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BloodDonor",
    tableName: "blood_donors",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    defaultScope: {
      attributes: { exclude: ["otp", "otpExpiry"] },
    },
    scopes: {
      withOtp: {
        attributes: { include: ["otp", "otpExpiry"] },
      },
    },
  }
);

export default BloodDonor;
