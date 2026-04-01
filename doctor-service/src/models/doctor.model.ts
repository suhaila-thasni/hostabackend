import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcrypt";

/* =======================
   INTERFACES
======================= */

interface IConsultingSession {
  open: string;
  close: string;
}

interface IConsulting {
  morning_session?: IConsultingSession;
  evening_session?: IConsultingSession;
}

interface IAddress {
  country?: string;
  state?: string;
  district?: string;
  place: string;
  pincode: number;
}

interface IDoctor {
  id: number;
  firstName: string;
  lastName: string;
  department?: string;
  specialist?: string;
  address: IAddress;
  phone: string;
  email?: string;
  password?: string;
  fees?: number;
  dob?: Date;
  gender?: string;
  knowLanguages?: string[];
  qualification?: string;
  consulting?: IConsulting;
  bookingOpen: boolean;
}

/* =======================
   CREATE TYPE (Optional Fields)
======================= */

type DoctorCreationAttributes = Optional<
  IDoctor,
  "id" | "email" | "password" | "fees" | "dob" | "gender" | "knowLanguages" | "qualification" | "consulting" | "department" | "specialist"
>;

/* =======================
   MODEL CLASS
======================= */

class Doctor
  extends Model<IDoctor, DoctorCreationAttributes>
  implements IDoctor
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public department?: string;
  public specialist?: string;
  public phone!: string;
  public email?: string;
  public password?: string;
  public fees?: number;
  public dob?: Date;
  public gender?: string;
  public knowLanguages?: string[];
  public qualification?: string;
  public consulting?: IConsulting;
  public bookingOpen!: boolean;
  public address!: IAddress;
  public displayName!: string;
}

/* =======================
   INIT MODEL
======================= */

Doctor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    department: {
      type: DataTypes.STRING,
    },

    specialist: {
      type: DataTypes.STRING,
    },

    qualification: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
    },

    fees: {
      type: DataTypes.DECIMAL(10, 2), 
    },

    gender: {
      type: DataTypes.STRING,
    },

    dob: {
      type: DataTypes.DATE,
    },

    knowLanguages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },

    address: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    consulting: {
      type: DataTypes.JSONB,
    },

    bookingOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Doctor",
    tableName: "doctor",
    timestamps: true,

    defaultScope: {
      attributes: { exclude: ["password"] },
    },

    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
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

Doctor.beforeCreate(async (doctor: Doctor) => {
  if (doctor.password) {
    doctor.password = await bcrypt.hash(doctor.password, 10);
  }
});

Doctor.beforeUpdate(async (doctor: Doctor) => {
  if (doctor.changed("password")) {
    doctor.password = await bcrypt.hash(doctor.password!, 10);
  }
});



export default Doctor;