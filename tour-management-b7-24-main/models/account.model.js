import {
  DataTypes
} from "sequelize";
import sequelize from "../config/database.js";

const Account = sequelize.define("Account", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // Token dùng để xác thực (lưu trong cookie)
  token: {
    type: DataTypes.STRING(255),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  avatar: {
    type: DataTypes.STRING(500),
  },
  // Khóa ngoại liên kết với bảng roles
  role_id: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: "active",
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "accounts",
  timestamps: true,
});

export default Account;