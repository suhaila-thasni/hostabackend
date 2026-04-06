import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IBloodBank {
  id?: number;
  stockId?: string; // Virtual ID
  bloodGroup: string;
  count: number;
}

class BloodBank extends Model<IBloodBank> implements IBloodBank {
  public id!: number;
  public readonly stockId!: string;
  public bloodGroup!: string;
  public count!: number;
}

BloodBank.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    stockId: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue("id");
        return `#BLD${String(id).padStart(5, '0')}`;
      }
    },
    bloodGroup: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"),
      allowNull: false,
      unique: true
    },
    count: { type: DataTypes.INTEGER, defaultValue: 0 }
  },
  { sequelize, modelName: "BloodBank", tableName: "blood_banks", timestamps: true }
);

export default BloodBank;




