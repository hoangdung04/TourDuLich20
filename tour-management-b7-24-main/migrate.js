/**
 * Script tạo bảng roles và accounts trong MySQL
 * Chạy: node migrate.js
 */
import sequelize from "./config/database.js";
import Role from "./models/role.model.js";
import Account from "./models/account.model.js";
import OtpVerify from "./models/otp.model.js";
import OrderItem from "./models/order-item.model.js";
import crypto from "crypto";

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};


const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

async function migrate() {
  try {
    console.log("Đang kết nối database...");
    await sequelize.authenticate();
    console.log("Kết nối thành công!");

    // Tạo bảng roles (force: false = chỉ tạo nếu chưa tồn tại)
    await Role.sync({ alter: true });
    console.log("✅ Bảng roles đã sẵn sàng");

    // Tạo bảng accounts
    await Account.sync({ alter: true });
    console.log("✅ Bảng accounts đã sẵn sàng");

    // Tạo bảng otp_verifications
    await OtpVerify.sync({ alter: true });
    console.log("✅ Bảng otp_verifications đã sẵn sàng");

    // Tạo bảng orders_item
    await OrderItem.sync({ alter: true });
    console.log("✅ Bảng orders_item đã sẵn sàng");

    // Tạo role "Super Admin" nếu chưa có
    const [superAdminRole, createdRole] = await Role.findOrCreate({
      where: { title: "Super Admin" },
      defaults: {
        title: "Super Admin",
        description: "Toàn quyền quản trị hệ thống",
        status: "active",
        permissions: [
          "tours_view", "tours_create", "tours_edit", "tours_delete",
          "categories_view", "categories_create", "categories_edit", "categories_delete",
          "accounts_view", "accounts_create", "accounts_edit", "accounts_delete",
          "roles_view", "roles_create", "roles_edit", "roles_delete", "roles_permissions",
          "orders_view", "orders_edit", "orders_delete",
        ],
      },
    });
    console.log(createdRole ? "✅ Tạo role Super Admin thành công" : "ℹ️ Role Super Admin đã tồn tại");

    // Tạo tài khoản admin mặc định nếu chưa có
    const [adminAccount, createdAccount] = await Account.findOrCreate({
      where: { email: "admin@gmail.com" },
      defaults: {
        fullName: "Super Admin",
        email: "admin@gmail.com",
        password: hashPassword("123456"),
        token: generateToken(),
        role_id: superAdminRole.id,
        status: "active",
      },
    });
    console.log(createdAccount ? "✅ Tạo tài khoản admin@gmail.com (password: 123456) thành công" : "ℹ️ Tài khoản admin đã tồn tại");

    console.log("\n🎉 Migration hoàn tất!");
    console.log("📌 Đăng nhập: POST /api/admin/auth/login");
    console.log("   email: admin@gmail.com");
    console.log("   password: 123456");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration thất bại:", error);
    process.exit(1);
  }
}

migrate();
