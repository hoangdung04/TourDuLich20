import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OtpVerify = sequelize.define("OtpVerify", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  expireAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: "otp_verifications",
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

export default OtpVerify;
