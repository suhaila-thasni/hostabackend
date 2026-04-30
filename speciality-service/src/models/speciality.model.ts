import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

interface IPicture {
  imageUrl?: string;
  public_id?: string;

}

export interface ISpeciality {
  id: number;
  name: string;
  picture?: IPicture;
  isActive?: boolean;
  isDelete?: boolean;
  hospitalId?: number;
}

/* =======================
   CREATION TYPE
======================= */

type SpecialityCreationAttributes = Optional<
  ISpeciality,
  "id" | "picture" | "isActive" | "isDelete" | "hospitalId"
>;

/* =======================
   MODEL CLASS
======================= */

class Speciality
  extends Model<ISpeciality, SpecialityCreationAttributes>
  implements ISpeciality
{
  public id!: number;
  public name!: string;
  public picture?: IPicture;
  public isActive?: boolean;
  public isDelete?: boolean;
  public hospitalId?: number;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/* =======================
   INIT MODEL
======================= */

Speciality.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },  

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    picture: {
      type: DataTypes.JSONB, // store { imageUrl, public_id }
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    isDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Speciality",
    tableName: "speciality",
    timestamps: true,
    paranoid: true, // 🔥 Enables Soft Delete

    indexes: [
      {
        fields: ["name"],
      },
    ],
  }
);

export default Speciality;