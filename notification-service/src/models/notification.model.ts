import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

interface INotification {

  id: number;

  userId?: number;
  hospitalId?: number;
  labId?: number;
  staffId?: number;
  pharmacyId?: number;
  doctorId?: number;

  message: string;

  userIsRead: boolean;
  hospitalIsRead: boolean;
  labIsRead: boolean;
  staffIsRead: boolean;
  pharmacyIsRead: boolean;
  doctorIsRead: boolean;
}

/* =======================
   OPTIONAL FIELDS
======================= */

type NotificationCreationAttributes =
  Optional<
    INotification,
    | "id"
    | "userIsRead"
    | "hospitalIsRead"
    | "doctorIsRead"
    | "labIsRead"
    | "pharmacyIsRead"
    | "staffIsRead"
  >;

/* =======================
   MODEL CLASS
======================= */

class Notification
  extends Model<
    INotification,
    NotificationCreationAttributes
  >
  implements INotification
{

  public id!: number;

  public userId?: number;
  public hospitalId?: number;
  public labId?: number;
  public staffId?: number;
  public pharmacyId?: number;
  public doctorId?: number;

  public message!: string;

  public userIsRead!: boolean;
  public hospitalIsRead!: boolean;
  public labIsRead!: boolean;
  public staffIsRead!: boolean;
  public pharmacyIsRead!: boolean;
  public doctorIsRead!: boolean;
}

/* =======================
   INIT
======================= */

Notification.init(

  {

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    labId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    pharmacyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    /* READ STATUS */

    userIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    hospitalIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    labIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    staffIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    pharmacyIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    doctorIsRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

  },

  {
    sequelize,
    modelName: "Notification",
    tableName: "notification",
    timestamps: true,
  }

);

export default Notification;