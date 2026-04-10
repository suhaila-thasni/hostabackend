import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

interface IReview {

  id: number;
  userId?: number;
  hospitalId?: number; 
  doctorId?: number;
  comment: string;

  
}

/* =======================
   OPTIONAL FIELDS
======================= */

type ReviewCreationAttributes =
  Optional<
    IReview,
    | "id"
    | "userId"
    | "hospitalId"
    | "doctorId"
  >;

/* =======================
   MODEL CLASS
======================= */

class Review
  extends Model<
    IReview,
    ReviewCreationAttributes
  >
  implements IReview
{

  public id!: number;

  public userId?: number;
  public hospitalId?: number;
  public doctorId?: number;

  public comment!: string;

}

/* =======================
   INIT
======================= */

Review.init(

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


    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    comment: {
      type: DataTypes.STRING,
      allowNull: false,
    },


  },

  {
    sequelize,
    modelName: "Review",
    tableName: "review",
    timestamps: true,
  }

);

export default Review;