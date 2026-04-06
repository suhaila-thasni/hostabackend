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
  email?: string;
  password?: string;
}

class Ambulance extends Model<IAmbulance> implements IAmbulance {
  public id!: number;
  public readonly ambulanceId!: string;
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
    paranoid: true, // Enables soft deletes for ambulances
  }
);

export default Ambulance;