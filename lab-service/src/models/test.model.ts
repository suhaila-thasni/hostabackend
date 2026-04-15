import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

export interface ITest {
  id: number;
  test_name: string;

  test_no: number;

  rate: number;
  discount?: number;

  type: string;

  isActive?: boolean;
}

/* =======================
   CREATION ATTRIBUTES
======================= */

type TestCreationAttributes = Optional<
  ITest,
  | "id"
  | "discount"
  | "isActive"
>;

/* =======================
   MODEL CLASS
======================= */

class Test
  extends Model<ITest, TestCreationAttributes>
  implements ITest
{
  public id!: number;
  public test_name!: string;

  public test_no!: number;

  public rate!: number;
  public discount?: number;

  public type!: string;

  public isActive?: boolean;
}

/* =======================
   INIT MODEL
======================= */

Test.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    test_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    /* Serial Number (Display Order) */

    test_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },

  {
    sequelize,

    modelName: "Test",
    tableName: "test",

    timestamps: true,
  }
);

export default Test;