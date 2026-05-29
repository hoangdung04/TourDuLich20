import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(500),
  },
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
  },
  paymentMethod: {
    type: DataTypes.STRING(20),
    defaultValue: "cash",
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Đặt giá trị mặc định là false
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'orders',
  timestamps: true, // Tự động quản lý createdAt và updatedAt
});

export default Order;
