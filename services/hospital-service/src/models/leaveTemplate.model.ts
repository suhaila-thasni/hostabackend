import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACES
======================= */

export interface ILeaveTemplate {
  id: number;
  hospitalId?: number | null;
  employeeId?: number | null;
  employeeType?: string;
  templateName: string;
  reasonCategory: string; // "Family Event", "Family Visit", "Religious / Cultural", "Travel / Vacation", "Medical / Health", "Personal", "Other"
  templateText: string;
  placeholders?: string[];
  isPredefined: boolean;
  isRecommended?: boolean;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

type LeaveTemplateCreationAttributes = Optional<
  ILeaveTemplate,
  | "id"
  | "hospitalId"
  | "employeeId"
  | "employeeType"
  | "placeholders"
  | "isPredefined"
  | "isRecommended"
  | "icon"
>;

class LeaveTemplate
  extends Model<ILeaveTemplate, LeaveTemplateCreationAttributes>
  implements ILeaveTemplate
{
  public id!: number;
  public hospitalId?: number | null;
  public employeeId?: number | null;
  public employeeType?: string;
  public templateName!: string;
  public reasonCategory!: string;
  public templateText!: string;
  public placeholders?: string[];
  public isPredefined!: boolean;
  public isRecommended?: boolean;
  public icon?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

LeaveTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employeeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    templateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reasonCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    placeholders: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [
        "[start date]",
        "[end date]",
        "[total days]",
        "[reason]",
        "[relation]",
        "[handover person]",
      ],
    },
    isPredefined: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "file-text",
    },
  },
  {
    sequelize,
    modelName: "LeaveTemplate",
    tableName: "leave_templates",
    timestamps: true,
    paranoid: true,
  }
);

export default LeaveTemplate;
