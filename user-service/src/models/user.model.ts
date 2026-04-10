import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IUser {
  id: number;
  userId?: string; // Virtual ID
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: any;
  fcmToken?: string;
  otp?: string;
  otpExpiry?: Date;
}

class User extends Model<IUser> implements IUser {
  public id!: number;
  public readonly userId!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public phone!: string;
  public picture!: any;
  public fcmToken!: string;
  public otp?: string;
  public otpExpiry?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue("id");
        if (!id) return null;
        return `#USR${String(id).padStart(5, "0")}`;
      },
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
      unique: true,
    },

    picture: {
      type: DataTypes.JSONB, // 🔥 store imageUrl + public_id
    },

    fcmToken: {
      type: DataTypes.STRING,
    },

    otp: {
      type: DataTypes.STRING,
    },

    otpExpiry: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    paranoid: true, // Enables soft deletes (sets deletedAt instead of row deletion)
  }
);

export default User;
