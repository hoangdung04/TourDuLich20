import Account from "../../models/account.model.js";
import { generateToken, hashPassword, comparePassword } from "../../helpers/generate.helper.js";

// [POST] /api/client/auth/register - Đăng ký tài khoản người dùng
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existing = await Account.findOne({ where: { email, deleted: false } });
    if (existing) {
      return res.status(400).json({ code: "error", message: "Email này đã được sử dụng" });
    }

    // Mã hóa mật khẩu và tạo token
    const hashedPassword = hashPassword(password);
    const token = generateToken();

    // Tạo tài khoản mới (không có role_id → là người dùng thường)
    const newAccount = await Account.create({
      fullName,
      email,
      password: hashedPassword,
      token,
      phone: phone || null,
      role_id: null, // Người dùng thường KHÔNG có role_id
      status: "active",
      deleted: false,
    });

    return res.json({
      code: "success",
      message: "Đăng ký thành công!",
      token,
      user: {
        id: newAccount.id,
        fullName: newAccount.fullName,
        email: newAccount.email,
        phone: newAccount.phone,
        avatar: newAccount.avatar,
        role_id: null,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [POST] /api/client/auth/login - Đăng nhập người dùng thường
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm tài khoản theo email
    const user = await Account.findOne({
      where: { email, deleted: false, status: "active" },
    });

    if (!user) {
      return res.status(401).json({ code: "error", message: "Email không tồn tại hoặc tài khoản bị khóa" });
    }

    // So sánh mật khẩu
    if (!comparePassword(password, user.password)) {
      return res.status(401).json({ code: "error", message: "Mật khẩu không đúng" });
    }

    // Tạo token mới và lưu vào DB
    const token = generateToken();
    await user.update({ token });

    return res.json({
      code: "success",
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role_id: user.role_id, // null nếu là người dùng thường
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [POST] /api/client/auth/logout - Đăng xuất người dùng
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (token) {
      // Xóa token trong DB để vô hiệu hóa phiên đăng nhập
      await Account.update({ token: null }, { where: { token } });
    }

    return res.json({ code: "success", message: "Đăng xuất thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
