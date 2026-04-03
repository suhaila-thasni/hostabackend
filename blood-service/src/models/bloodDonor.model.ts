import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IBloodDonor {
  id?: number;
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
}

class BloodDonor extends Model<IBloodDonor> implements IBloodDonor {
  public id!: number;
  public phone!: string;
  public userId!: number;
  public dateOfBirth!: Date;
  public bloodGroup!: string;
  public address!: any;
}

BloodDonor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{10}$/,
      },
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
  },
  {
    sequelize,
    modelName: "BloodDonor",
    tableName: "blood_donors",
    timestamps: true,
  }
);

export default BloodDonor;
