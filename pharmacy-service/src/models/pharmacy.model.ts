import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

interface IPharmacy {
  id?: number;
  productId?: string; // Virtual Display ID
  productImage?: any; // To store { url, publicId }

  name: string;
  price: number;
  offerPrice?: number;
  
  purchaseDate?: Date;
  expireDate?: Date;
  
  unit: string; // e.g., "mg", "ml"
  stock: number;
  description?: string;
  category?: string;
}

class Pharmacy extends Model<IPharmacy> implements IPharmacy {
  public id!: number;
  public readonly productId!: string;
  public productImage!: any;

  public name!: string;
  public price!: number;
  public offerPrice!: number;
  
  public purchaseDate!: Date;
  public expireDate!: Date;
  
  public unit!: string;
  public stock!: number;
  public description!: string;
  public category!: string;
}

Pharmacy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue("id");
        return `#PR${String(id).padStart(5, "0")}`;
      },
    },

    productImage: {
      type: DataTypes.JSONB,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    offerPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },

    purchaseDate: {
      type: DataTypes.DATE,
    },

    expireDate: {
      type: DataTypes.DATE,
    },

    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    description: {
      type: DataTypes.TEXT,
    },

    category: {
      type: DataTypes.STRING,
      defaultValue: "Medicine",
    },
  },
  {
    sequelize,
    modelName: "Pharmacy",
    tableName: "pharmacies",
    timestamps: true,
    paranoid: true, // Enables soft deletes
  }
);

export default Pharmacy;
