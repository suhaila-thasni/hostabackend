import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import Hospital from "./hospital.model";
import RfidDevice from "./Device.model";

export type FingerprintEmployeeType = "Doctor" | "Staff";
export type FingerprintQuality = "Poor" | "Fair" | "Good" | "Excellent";
export type FingerprintStatus = "Active" | "Inactive";

export interface FingerprintEnrollmentAttributes {
  id: number;
  hospitalId: number;
  employeeId: number;
  employeeType: FingerprintEmployeeType;
  employeeName: string;
  department?: string | null;
  deviceId: string;
  deviceDbId?: number | null;
  fingerPosition?: string | null;
  fingerprintHash: string;
  templateReference?: string | null;
  quality: FingerprintQuality;
  attempts: number;
  status: FingerprintStatus;
  enrolledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FingerprintEnrollmentCreationAttributes
  extends Optional<
    FingerprintEnrollmentAttributes,
    | "id"
    | "department"
    | "deviceDbId"
    | "fingerPosition"
    | "templateReference"
    | "quality"
    | "attempts"
    | "status"
    | "enrolledAt"
    | "createdAt"
    | "updatedAt"
  > { }

class FingerprintEnrollment
  extends Model<FingerprintEnrollmentAttributes, FingerprintEnrollmentCreationAttributes>
  implements FingerprintEnrollmentAttributes {
  public id!: number;
  public hospitalId!: number;
  public employeeId!: number;
  public employeeType!: FingerprintEmployeeType;
  public employeeName!: string;
  public department?: string | null;
  public deviceId!: string;
  public deviceDbId?: number | null;
  public fingerPosition?: string | null;
  public fingerprintHash!: string;
  public templateReference?: string | null;
  public quality!: FingerprintQuality;
  public attempts!: number;
  public status!: FingerprintStatus;
  public enrolledAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FingerprintEnrollment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Hospital, key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    employeeType: { type: DataTypes.ENUM("Doctor", "Staff"), allowNull: false },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: true },
    deviceId: { type: DataTypes.STRING, allowNull: false },
    deviceDbId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: RfidDevice, key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    fingerPosition: { type: DataTypes.STRING, allowNull: true },
    fingerprintHash: { type: DataTypes.STRING, allowNull: false },
    templateReference: { type: DataTypes.STRING, allowNull: true },
    quality: {
      type: DataTypes.ENUM("Poor", "Fair", "Good", "Excellent"),
      allowNull: false,
      defaultValue: "Good",
    },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "FingerprintEnrollment",
    tableName: "fingerprint_enrollments",
    indexes: [
      { unique: true, fields: ["hospitalId", "employeeId", "employeeType", "fingerPosition"] },
      { unique: true, fields: ["hospitalId", "fingerprintHash"] },
      { unique: true, fields: ["hospitalId", "employeeId", "employeeType", "deviceId"], name: "fingerprint_enrollments_employee_device_unique" },
      { fields: ["hospitalId", "status"] },
      { fields: ["deviceId"] },
    ],
  }
);

Hospital.hasMany(FingerprintEnrollment, { foreignKey: "hospitalId" });
FingerprintEnrollment.belongsTo(Hospital, { foreignKey: "hospitalId" });
RfidDevice.hasMany(FingerprintEnrollment, { foreignKey: "deviceDbId" });
FingerprintEnrollment.belongsTo(RfidDevice, { foreignKey: "deviceDbId" });

export default FingerprintEnrollment;















