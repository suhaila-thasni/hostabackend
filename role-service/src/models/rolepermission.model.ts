import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";


interface IRolePermission {
  id: number;
  roleId: number;
  permissionId: number;
}

class RolePermission
  extends Model<IRolePermission>
  implements IRolePermission {

  public id!: number;
  public roleId!: number;
  public permissionId!: number;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RolePermission",
    tableName: "role_permissions",
    timestamps: false,
  }
);

export default RolePermission;