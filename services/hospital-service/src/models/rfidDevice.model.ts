import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcryptjs";
import Hospital from "./hospital.model";

export interface RfidDeviceAttributes {
  id: number;
  hospitalId: number;
  deviceId: string;
  deviceName: string;
  location: string;
  locationImage?: string;
  deviceImage?: string;
  deviceType: "face" | "rfid" | "fingerprint";
  apiKey: string;
  secretKey: string;
  status: "Active" | "Disabled" | "Unregistered";
  unregisteredAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RfidDeviceCreationAttributes extends Optional<RfidDeviceAttributes, "id" | "status" | "unregisteredAt" | "createdAt" | "updatedAt"> {}

class RfidDevice extends Model<RfidDeviceAttributes, RfidDeviceCreationAttributes> implements RfidDeviceAttributes {
  public id!: number;
  public hospitalId!: number;
  public deviceId!: string;
  public deviceName!: string;
  public location!: string;
  public locationImage?: string;
  public deviceImage?: string;
  public deviceType!: "face" | "rfid" | "fingerprint";
  public apiKey!: string;
  public secretKey!: string;
  public status!: "Active" | "Disabled" | "Unregistered";
  public unregisteredAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to verify secret key
  public async verifySecret(plainSecret: string): Promise<boolean> {
    return await bcrypt.compare(plainSecret, this.secretKey);
  }
}

RfidDevice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Hospital,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.ENUM("face", "rfid", "fingerprint"),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    secretKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Disabled", "Unregistered"),
      allowNull: false,
      defaultValue: "Active",
    },
    unregisteredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "rfid_devices",
    hooks: {
      beforeCreate: async (device: RfidDevice) => {
        if (device.secretKey) {
          const salt = await bcrypt.genSalt(10);
          device.secretKey = await bcrypt.hash(device.secretKey, salt);
        }
      },
      beforeUpdate: async (device: RfidDevice) => {
        if (device.changed("secretKey")) {
          const salt = await bcrypt.genSalt(10);
          device.secretKey = await bcrypt.hash(device.secretKey, salt);
        }
      },
    },
  }
);

Hospital.hasMany(RfidDevice, { foreignKey: "hospitalId" });
RfidDevice.belongsTo(Hospital, { foreignKey: "hospitalId" });

export default RfidDevice;
