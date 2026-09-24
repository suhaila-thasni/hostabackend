import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import Hospital from "./hospital.model";
import RfidDevice from "./Device.model";

export type RfidEmployeeType = "Doctor" | "Staff";
export type RfidAssignmentStatus = "Active" | "Inactive";

export interface RfidCardAssignmentAttributes {
  id: number;
  hospitalId: number;
  employeeId: number;
  employeeType: RfidEmployeeType;
  employeeName: string;
  department?: string | null;
  deviceId: string;
  deviceDbId?: number | null;
  cardNumber: string;
  status: RfidAssignmentStatus;
  assignedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RfidCardAssignmentCreationAttributes
  extends Optional<
    RfidCardAssignmentAttributes,
    | "id"
    | "department"
    | "deviceDbId"
    | "status"
    | "assignedAt"
    | "createdAt"
    | "updatedAt"
  > { }

class RfidCardAssignment
  extends Model<RfidCardAssignmentAttributes, RfidCardAssignmentCreationAttributes>
  implements RfidCardAssignmentAttributes {
  public id!: number;
  public hospitalId!: number;
  public employeeId!: number;
  public employeeType!: RfidEmployeeType;
  public employeeName!: string;
  public department?: string | null;
  public deviceId!: string;
  public deviceDbId?: number | null;
  public cardNumber!: string;
  public status!: RfidAssignmentStatus;
  public assignedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RfidCardAssignment.init(
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
    cardNumber: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "RfidCardAssignment",
    tableName: "rfid_card_assignments",
    indexes: [
      { unique: true, fields: ["hospitalId", "employeeId", "employeeType"] },
      { unique: true, fields: ["hospitalId", "cardNumber"] },
      { fields: ["hospitalId", "status"] },
      { fields: ["deviceId"] },
    ],
  }
);

Hospital.hasMany(RfidCardAssignment, { foreignKey: "hospitalId" });
RfidCardAssignment.belongsTo(Hospital, { foreignKey: "hospitalId" });
RfidDevice.hasMany(RfidCardAssignment, { foreignKey: "deviceDbId" });
RfidCardAssignment.belongsTo(RfidDevice, { foreignKey: "deviceDbId" });

export default RfidCardAssignment;
