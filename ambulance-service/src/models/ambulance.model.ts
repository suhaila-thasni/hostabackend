import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IAmbulance {
  id: number;
  ambulanceId?: string; // Virtual ID
  serviceName: string;
  address: {
    country?: string;
    state?: string;
    district?: string;
    place: string;
    pincode: number;
  };
  phone: string;
  vehicleType?: string;
  otp?: string;
  otpExpiry?: Date;
  userId?: number;
}

class Ambulance extends Model<IAmbulance> implements IAmbulance {
  public id!: number;
  public readonly ambulanceId!: string;
  public serviceName!: string;
  public phone!: string;
  public vehicleType!: string;
  public address!: any;
  public otp!: string;
  public otpExpiry!: Date;
  public userId!: number;
}

Ambulance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ambulanceId: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue("id");
        return `#AMB${String(id).padStart(5, "0")}`;
      },
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    vehicleType: {
      type: DataTypes.STRING,
    },

    address: {
      type: DataTypes.JSONB,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, 
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Ambulance",
    tableName: "ambulances",
    timestamps: true,
    paranoid: true, // Enables soft deletes for ambulances
    defaultScope: {
      attributes: { exclude: ["otp", "otpExpiry"] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["otp", "otpExpiry"] },
      },
    },

  }
);

export default Ambulance;