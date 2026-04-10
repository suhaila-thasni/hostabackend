import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

/* =======================
   INTERFACE
======================= */

interface IRating {
  id: number;

  userId: number;

  hospitalId?: number;
  doctorId?: number;

  rating: number; // 1–5 stars
}

/* =======================
   OPTIONAL
======================= */

type RatingCreationAttributes =
  Optional<
    IRating,
    | "id"
    | "hospitalId"
    | "doctorId"
  >;

/* =======================
   MODEL
======================= */

class Rating
  extends Model<
    IRating,
    RatingCreationAttributes
  >
  implements IRating
{
  public id!: number;

  public userId!: number;

  public hospitalId?: number;
  public doctorId?: number;

  public rating!: number;
}

/* =======================
   INIT
======================= */

Rating.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },

  {
    sequelize,
    modelName: "Rating",
    tableName: "ratings",
    timestamps: true,

    /* UNIQUE RATING RULE */

    indexes: [
      {
        unique: true,
        fields: ["userId", "doctorId"],
      },
      {
        unique: true,
        fields: ["userId", "hospitalId"],
      },
    ],
  }
);

export default Rating;