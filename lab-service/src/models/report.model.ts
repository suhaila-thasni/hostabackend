import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   RESULT ITEM TYPE
======================= */

interface ITestReportItem {
  test_name: string;
  result: string;
  ref_range: string;
  units: string;
}

/* =======================
   MAIN REPORT INTERFACE
======================= */

export interface IReport {
  id: number;

   name?: string;
  email?: string;
  phone?: string;
  age?: number;
  location?: string;
  gender?: string

  test_reports: ITestReportItem[];

  sample: string;

  sample_date: Date;

  result_ready: Date;

  patientId: number;

  doctorId: number;

  patient_type: string;

  dept_unit: string;

  invoice_no: number;

  invoice_date: Date;

  referred_by?: string;

  result_verified?: string;

  isActive?: boolean;
}

/* =======================
   CREATION ATTRIBUTES
======================= */

type ReportCreationAttributes = Optional<
  IReport,
  | "id"
  |"name"
  |"age"
  |"phone"
  |"email"
  |"gender"
  |"location"
  | "referred_by"
  | "result_verified"
  | "isActive"
>;

/* =======================
   MODEL CLASS
======================= */

class Report
  extends Model<IReport, ReportCreationAttributes>
  implements IReport
{
  public id!: number;

  public test_reports!: ITestReportItem[];

  public sample!: string;

  public sample_date!: Date;

  public result_ready!: Date;

  public patientId!: number;

  public doctorId!: number;

  public patient_type!: string;

  public dept_unit!: string;

  public invoice_no!: number;

  public invoice_date!: Date;

  public referred_by?: string;

  public result_verified?: string;

  public name?: string;

  public age?: number;

  public email?: string;

  public location?: string;

  public gender?: string;

  public phone?: string;

  public isActive?: boolean;
}

/* =======================
   INIT MODEL
======================= */

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    test_reports: {
      type: DataTypes.JSONB, // PostgreSQL
      allowNull: false,
    },

    sample: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    sample_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    result_ready: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    patient_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    dept_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    invoice_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    referred_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    result_verified: {
      type: DataTypes.STRING,
      allowNull: true,
    },

        name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

       gender: {
      type: DataTypes.STRING,
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

    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },

    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true
    }, 

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },

  {
    sequelize,

    modelName: "Report",
    tableName: "report",

    timestamps: true,
  }
);

export default Report;