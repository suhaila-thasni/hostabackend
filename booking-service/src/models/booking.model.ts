import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

interface IBooking {
  id: number;

  patient_name: string;
  patient_phone: string;
  patient_place?: string;
  patient_dob?: string;

  userId: number;      // User account
  doctorId: number;    // Doctor
  hospitalId: number;  // Hospital

  booking_date: Date;
  consulting_time: string;

  status: "pending" | "accepted" | "declined" | "cancel";

  isActive?: boolean;
}

/* =======================
   OPTIONAL CREATE FIELDS
======================= */

type BookingCreationAttributes = Optional<
  IBooking,
  "id" | "status" | "isActive"
>;

/* =======================
   MODEL CLASS
======================= */

class Booking
  extends Model<IBooking, BookingCreationAttributes>
  implements IBooking
{
  public id!: number;

  public patient_name!: string;
  public patient_phone!: string;
  public patient_place?: string;
  public patient_dob?: string;

  public userId!: number;
  public doctorId!: number;
  public hospitalId!: number;


  public booking_date!: Date;
  public consulting_time!: string;

  public status!: "pending" | "accepted" | "declined" | "cancel";

  public isActive?: boolean;
}

/* =======================
   INIT MODEL
======================= */

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    patient_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    patient_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    patient_place: {
      type: DataTypes.STRING,
    },

    patient_dob: {
      type: DataTypes.STRING,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    booking_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    consulting_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "declined",
        "completed",
        "cancel"
      ),
      defaultValue: "pending",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "booking",
    timestamps: true,
  }
);

export default Booking;