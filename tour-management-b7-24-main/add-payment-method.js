/**
 * Migration: Thêm cột paymentMethod vào bảng orders
 * Chạy: node add-payment-method.js
 */
import sequelize from "./config/database.js";

async function addPaymentMethod() {
  try {
    console.log("Đang kết nối database...");
    await sequelize.authenticate();
    console.log("Kết nối thành công!");

    await sequelize.query(
      "ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(20) DEFAULT 'cash'"
    );
    console.log("✅ Đã thêm cột paymentMethod vào bảng orders!");

    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️ Cột paymentMethod đã tồn tại, bỏ qua.");
      process.exit(0);
    }
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
}

addPaymentMethod();
