/**
 * Migration: Tạo bảng articles và article_tours
 * Chạy: node migrate-articles.js
 */
import sequelize from "./config/database.js";
import Article from "./models/article.model.js";
import ArticleTour from "./models/article-tour.model.js";

async function migrateArticles() {
  try {
    console.log("Đang kết nối database...");
    await sequelize.authenticate();
    console.log("Kết nối thành công!");

    // Tạo bảng articles
    await Article.sync({ alter: true });
    console.log("✅ Bảng articles đã sẵn sàng");

    // Tạo bảng article_tours (bảng trung gian)
    await ArticleTour.sync({ alter: true });
    console.log("✅ Bảng article_tours đã sẵn sàng");

    console.log("\n🎉 Migration bài viết hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration thất bại:", error);
    process.exit(1);
  }
}

migrateArticles();
