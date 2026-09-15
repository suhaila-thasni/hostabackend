import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACES
======================= */

export interface IAttendance {
  id: number;
  hospitalId: number;
  employeeId?: number; // Unique employee ID (Doctor ID / Staff ID)
  employeeType?: string; // "Doctor" | "Staff" | "Nurse" | "Receptionist" | etc.
  roleId: number; // Legacy support / roleId assigned by hospital
  type: string; // "check-in" | "check-out"
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  selfie_url?: string;
  status?: string; // "Present" | "Late" | "Early Departure" | "Shift Completed" | "Absent" | "On Leave"
  method?: string; // "Face" | "Access Card" | "Punch In"
  roles?: any; // e.g., ["Doctor", "Nurse"]
  department?: string; // e.g., "Cardiology", "ENT"
  duration?: string; // e.g., "8h 08m"
  creator_type?: string;
  creator_id?: number;
  editor_type?: string;
  editor_id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/* =======================
   CREATION ATTRIBUTES
======================= */

type AttendanceCreationAttributes = Optional<IAttendance, "id">;

/* =======================
   MODEL CLASS
======================= */

class Attendance extends Model<IAttendance, AttendanceCreationAttributes> implements IAttendance {
  public declare id: number;
  public declare hospitalId: number;
  public declare employeeId?: number;
  public declare employeeType?: string;
  public declare roleId: number;
  public declare type: string;
  public declare timestamp: Date;
  public declare latitude?: number;
  public declare longitude?: number;
  public declare selfie_url?: string;
  public declare status?: string;
  public declare method?: string;
  public declare roles?: any;
  public declare department?: string;
  public declare duration?: string;
  public declare creator_type?: string;
  public declare creator_id?: number;
  public declare editor_type?: string;
  public declare editor_id?: number;
}

/* =======================
   INIT MODEL
======================= */

Attendance.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    hospitalId: { type: DataTypes.INTEGER, allowNull: false },
    employeeId: { type: DataTypes.INTEGER, allowNull: true },
    employeeType: { type: DataTypes.STRING, allowNull: true },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "References roleId assigned by the hospital",
    },
    type: { type: DataTypes.STRING, allowNull: false }, // "check-in" | "check-out"
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    selfie_url: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    method: { type: DataTypes.STRING, allowNull: true },
    roles: { type: DataTypes.JSON, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    duration: { type: DataTypes.STRING, allowNull: true },
    creator_type: { type: DataTypes.STRING, allowNull: true },
    creator_id: { type: DataTypes.INTEGER, allowNull: true },
    editor_type: { type: DataTypes.STRING, allowNull: true },
    editor_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: "Attendance",
    tableName: "attendances",
    timestamps: true,
    paranoid: true, // Enables soft delete via deletedAt
  }
);

export default Attendance;
