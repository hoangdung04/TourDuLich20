import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import slugify from "slugify";

const Article = sequelize.define("Article", {
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
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Lưu dạng JSON string: '["du-lich","cam-nang"]'
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
  tableName: "articles",
  timestamps: true,
});

// Tự động tạo slug từ title khi tạo mới
Article.beforeCreate((article) => {
  article.slug = slugify(`${article.title}-${Date.now()}`, {
    lower: true,
    strict: true,
    locale: "vi",
  });
});

// Cập nhật slug khi đổi title
Article.beforeUpdate((article) => {
  if (article.changed("title")) {
    article.slug = slugify(`${article.title}-${Date.now()}`, {
      lower: true,
      strict: true,
      locale: "vi",
    });
  }
});

export default Article;
