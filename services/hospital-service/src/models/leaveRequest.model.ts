import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACES
======================= */

export interface ILeaveRequest {
  id: number;
  hospitalId: number;
  employeeId: number;
  employeeType: "Doctor" | "Staff" | string;
  employeeName?: string;
  employeeEmail?: string;
  department?: string;
  leaveType: string; // "Casual", "Sick", "Annual", "Maternity", "Paternity", "Emergency", "Unpaid", etc.
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  templateId?: number | null;
  reasonCategory?: string; // "Family Event", "Health", "Vacation", "Personal", etc.
  reason: string;
  additionalDetails?: string | null;
  handoverToId?: number | null;
  handoverToName?: string | null;
  handoverToType?: string | null;
  handoverNotes?: string | null;
  isConfirmed?: boolean;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  adminComments?: string | null;
  actionBy?: number | null;
  actionByName?: string | null;
  actionDate?: Date | null;
  appliedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

type LeaveRequestCreationAttributes = Optional<
  ILeaveRequest,
  | "id"
  | "employeeName"
  | "employeeEmail"
  | "department"
  | "templateId"
  | "reasonCategory"
  | "additionalDetails"
  | "handoverToId"
  | "handoverToName"
  | "handoverToType"
  | "handoverNotes"
  | "isConfirmed"
  | "status"
  | "adminComments"
  | "actionBy"
  | "actionByName"
  | "actionDate"
  | "appliedAt"
>;

class LeaveRequest
  extends Model<ILeaveRequest, LeaveRequestCreationAttributes>
  implements ILeaveRequest
{
  public id!: number;
  public hospitalId!: number;
  public employeeId!: number;
  public employeeType!: "Doctor" | "Staff" | string;
  public employeeName?: string;
  public employeeEmail?: string;
  public department?: string;
  public leaveType!: string;
  public startDate!: string;
  public endDate!: string;
  public totalDays!: number;
  public templateId?: number | null;
  public reasonCategory?: string;
  public reason!: string;
  public additionalDetails?: string | null;
  public handoverToId?: number | null;
  public handoverToName?: string | null;
  public handoverToType?: string | null;
  public handoverNotes?: string | null;
  public isConfirmed?: boolean;
  public status!: "Pending" | "Approved" | "Rejected" | "Cancelled";
  public adminComments?: string | null;
  public actionBy?: number | null;
  public actionByName?: string | null;
  public actionDate?: Date | null;
  public appliedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

LeaveRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employeeType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Staff",
    },
    employeeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employeeEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leaveType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reasonCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    additionalDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    handoverToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    handoverToName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    handoverToType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    handoverNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isConfirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
    },
    adminComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actionBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actionByName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "LeaveRequest",
    tableName: "leave_requests",
    timestamps: true,
    paranoid: true,
  }
);

export default LeaveRequest;
