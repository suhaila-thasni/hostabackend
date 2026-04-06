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
}

class BloodDonor extends Model<IBloodDonor> implements IBloodDonor {
  public id!: number;
  public readonly donorId!: string;
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
    paranoid: true, // Enables soft deletes
  }
);

export default BloodDonor;
