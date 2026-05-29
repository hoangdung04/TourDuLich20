import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ArticleTour = sequelize.define("ArticleTour", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  article_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tour_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "article_tours",
  timestamps: false,
});

export default ArticleTour;
