import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

export interface IHoliday {
  id: number;
  hospitalId: number;
  name: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  repeatsAnnually: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHolidayCreationAttributes
  extends Optional<IHoliday, "id" | "endDate" | "repeatsAnnually" | "description"> {}

class Holiday extends Model<IHoliday, IHolidayCreationAttributes> implements IHoliday {
  public id!: number;
  public hospitalId!: number;
  public name!: string;
  public type!: string;
  public startDate!: Date;
  public endDate?: Date;
  public repeatsAnnually!: boolean;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Holiday.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repeatsAnnually: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "holidays",
    timestamps: true,
  }
);

export default Holiday;
