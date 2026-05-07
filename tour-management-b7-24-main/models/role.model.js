import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Role = sequelize.define("Role", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: "active",
  },
  // Mảng permissions lưu dạng JSON string, ví dụ: '["tours_view","tours_create"]'
  permissions: {
    type: DataTypes.TEXT("long"),
    defaultValue: "[]",
    get() {
      const raw = this.getDataValue("permissions");
      try {
        return JSON.parse(raw || "[]");
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue("permissions", JSON.stringify(value || []));
    },
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "roles",
  timestamps: true,
});

export default Role;
