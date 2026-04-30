import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcrypt";

/* =======================
   INTERFACES
======================= */

interface IConsultingSession {
  day: string;
  open: string;
  close: string;
  is_holiday?: boolean;
}

interface IAddress {
  country?: string;
  state?: string;
  district?: string;
  place: string;
  pincode: number;
}

export interface ILab {
  id: number;
  name: string;
  address: IAddress;
  phone: string;
  emergencyContact: string;

  hospitalId: number; // ✅ fixed type

  email?: string;
  password?: string;

  latitude: number;
  longitude: number;

  about: string;

  deleteRequested?: boolean;
  working_hours?: IConsultingSession[];

  web?: string;

  deleteDate?: Date;

  isActive?: boolean;
  isDelete?: boolean;

  otp?: string;
  otpExpiry?: Date;
}

/* =======================
   CREATION ATTRIBUTES
======================= */

type LabCreationAttributes = Optional<
  ILab,
  | "id"
  | "email"
  | "password"
  | "deleteRequested"
  | "working_hours"
  | "web"
  | "deleteDate"
  | "isActive"
  | "isDelete"
>;

/* =======================
   MODEL CLASS
======================= */

class Lab
  extends Model<ILab, LabCreationAttributes>
  implements ILab
{
  public id!: number;
  public name!: string;

  public address!: IAddress;

  public phone!: string;
  public emergencyContact!: string;

  public hospitalId!: number;

  public email?: string;
  public password?: string;

  public latitude!: number;
  public longitude!: number;

  public about!: string;

  public deleteRequested?: boolean;

  public working_hours?: IConsultingSession[];

  public web?: string;

  public deleteDate?: Date;

  public isActive?: boolean;
  public isDelete?: boolean;

  public otp?: string;
  public otpExpiry?: Date;
}

/* =======================
   INIT MODEL
======================= */

Lab.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },


    address: {
      type: DataTypes.JSONB, // PostgreSQL
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    hospitalId: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,

      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    web: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },

    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },

    about: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    working_hours: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    deleteRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    deleteDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    isDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

    modelName: "Lab",
    tableName: "lab",

    timestamps: true,
    paranoid: true,

    defaultScope: {
      attributes: {
        exclude: ["password", "otp", "otpExpiry"],
      },
    },

    scopes: {
      withPassword: {
        attributes: {
          include: ["password", "otp", "otpExpiry"],
        },
      },
    },

    indexes: [
      {
        unique: true,
        fields: ["phone"],
      },
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

/* =======================
   HOOKS (SECURITY)
======================= */

Lab.beforeCreate(async (lab: Lab) => {
  if (lab.password) {
    lab.password = await bcrypt.hash(lab.password, 10);
  }
});

Lab.beforeUpdate(async (lab: Lab) => {
  if (lab.changed("password")) {
    lab.password = await bcrypt.hash(lab.password!, 10);
  }
});

export default Lab;