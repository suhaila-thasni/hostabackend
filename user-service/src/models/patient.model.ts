import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IPatient {
  id: number;
  profileImage?: any;

  firstName: string;
  middleName?: string;
  lastName: string;

  bloodGroup: string;
  gender: string;
  maritalStatus?: string;
  patientType: string;

  age?: number;
  dob?: Date;

  company?: string;

  mobileNumber: string;
  emergencyNumber?: string;
  guardianName?: string;

  addressLine1?: string;
  addressLine2?: string;

  country?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  referredBy?: number;
  department?: number;
  referredOn?: Date;

  notes?: string;

  email?: string;
  password?: string;
}

class Patient extends Model<IPatient> implements IPatient {
  public id!: number;
  public profileImage!: any;

  public firstName!: string;
  public middleName!: string;
  public lastName!: string;

  public bloodGroup!: string;
  public gender!: string;
  public maritalStatus!: string;
  public patientType!: string;

  public age!: number;
  public dob!: Date;

  public company!: string;

  public mobileNumber!: string;
  public emergencyNumber!: string;
  public guardianName!: string;

  public addressLine1!: string;
  public addressLine2!: string;

  public country!: string;
  public city!: string;
  public state!: string;
  public pinCode!: string;

  public referredBy!: number;
  public department!: number;
  public referredOn!: Date;

  public notes!: string;

  public email!: string;
  public password!: string;
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // 🔥 Image (JSONB)
    profileImage: {
      type: DataTypes.JSONB,
    },

    // Basic Info
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: DataTypes.STRING,
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // ENUMS
    bloodGroup: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"),
      allowNull: false,
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },

    maritalStatus: {
      type: DataTypes.ENUM("Single", "Married", "Divorced", "Widowed"),
    },

    patientType: {
      type: DataTypes.ENUM("Inpatient", "Outpatient"),
      allowNull: false,
    },

    age: DataTypes.INTEGER,
    dob: DataTypes.DATE,

    company: DataTypes.STRING,

    // Contact
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    emergencyNumber: DataTypes.STRING,
    guardianName: DataTypes.STRING,

    addressLine1: DataTypes.STRING,
    addressLine2: DataTypes.STRING,

    country: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    pinCode: DataTypes.STRING,

    // 🔥 Foreign Keys
    referredBy: {
      type: DataTypes.INTEGER, // Doctor ID
    },

    department: {
      type: DataTypes.INTEGER, // Department ID
    },

    referredOn: DataTypes.DATE,

    notes: DataTypes.TEXT,

    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },

    password: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "Patient",
    tableName: "patients",
    timestamps: true,
  }
);

export default Patient;
