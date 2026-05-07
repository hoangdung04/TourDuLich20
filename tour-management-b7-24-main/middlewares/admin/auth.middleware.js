import Account from "../../models/account.model.js";
import Role from "../../models/role.model.js";

/**
 * Middleware: Kiểm tra xác thực (Authentication)
 * - Lấy token từ header Authorization: Bearer <token>
 * - Tìm account theo token, load role + permissions
 * - Gắn req.user và req.role vào request
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Lấy token từ header "Authorization: Bearer <token>" hoặc query param
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.query.token;

    if (!token) {
      return res.status(401).json({ code: "error", message: "Bạn chưa đăng nhập" });
    }

    // Tìm account theo token
    const user = await Account.findOne({
      where: { token, deleted: false, status: "active" },
      attributes: { exclude: ["password"] },
      raw: false,
    });

    if (!user) {
      return res.status(401).json({ code: "error", message: "Token không hợp lệ hoặc tài khoản bị khóa" });
    }

    // Tìm role của user
    let role = null;
    if (user.role_id) {
      role = await Role.findOne({
        where: { id: user.role_id, deleted: false },
      });
    }

    // Gắn thông tin vào request để dùng ở controller/middleware tiếp theo
    req.user = user;
    req.role = role;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server xác thực" });
  }
};
