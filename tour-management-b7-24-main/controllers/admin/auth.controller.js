import Account from "../../models/account.model.js";
import { hashPassword, comparePassword, generateToken } from "../../helpers/generate.helper.js";

// [POST] /api/admin/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: "error", message: "Vui lòng nhập email và mật khẩu" });
    }

    const account = await Account.findOne({
      where: { email, deleted: false },
    });

    if (!account) {
      return res.status(401).json({ code: "error", message: "Email không tồn tại" });
    }

    if (account.status === "inactive") {
      return res.status(403).json({ code: "error", message: "Tài khoản đã bị khóa" });
    }

    if (!comparePassword(password, account.password)) {
      return res.status(401).json({ code: "error", message: "Mật khẩu không đúng" });
    }

    // Sinh token mới mỗi lần đăng nhập
    const token = generateToken();
    await Account.update({ token }, { where: { id: account.id } });

    res.json({
      code: "success",
      message: "Đăng nhập thành công",
      token,
      user: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        avatar: account.avatar,
        role_id: account.role_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [POST] /api/admin/auth/logout
export const logout = async (req, res) => {
  try {
    // Xóa token trong DB để vô hiệu hóa session
    await Account.update({ token: null }, { where: { id: req.user.id } });
    res.json({ code: "success", message: "Đăng xuất thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [GET] /api/admin/auth/me  – Lấy thông tin tài khoản hiện tại
export const me = async (req, res) => {
  try {
    const user = req.user;
    const role = req.role;
    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role_id: user.role_id,
        status: user.status,
      },
      role: role
        ? { id: role.id, title: role.title, permissions: role.permissions }
        : null,
    });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
