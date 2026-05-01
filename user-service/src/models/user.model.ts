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
   joinAccountId?:number;
   relationType?:string;
  otp?: string;
  otpExpiry?: Date;
  roleId?: number;
}

class User extends Model<IUser> implements IUser {
  public id!: number;
  public readonly userId!: string;
  public joinAccountId!:number;
  public name!: string;
  public email!: string;
  public password!: string;
  public phone!: string;
  public picture!: any;
  public fcmToken!: string;
  public relationType!:string;
  public otp?: string;
  public otpExpiry?: Date;
  public roleId: number;
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

    joinAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,

      references: {
        model: "user",
        key: "id",
      },
      

      onDelete: "CASCADE",
    },

    relationType:{
      type:DataTypes.ENUM("mother","father","guardian"),
      allowNull: true,
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
    
        roleId: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: true,
    },

    fcmToken: {
      type: DataTypes.STRING,
    },

    otp: {
      type: DataTypes.STRING,
    },

    otpExpiry: {
      type: DataTypes.DATE,
    }
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
