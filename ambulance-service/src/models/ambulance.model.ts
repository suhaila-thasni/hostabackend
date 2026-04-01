import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IAmbulance {
  id: number;
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
  email?: string;
  password?: string;
}

class Ambulance extends Model<IAmbulance> implements IAmbulance {
  public id!: number;
  public serviceName!: string;
  public phone!: string;
  public vehicleType!: string;
  public email!: string;
  public password!: string;
  public address!: any;
}

Ambulance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.JSONB, // 🔥 PostgreSQL powerful feature
    },
  },
  {
    sequelize,
    modelName: "Ambulance",
    tableName: "ambulances",
    timestamps: true,
  }
);

export default Ambulance;