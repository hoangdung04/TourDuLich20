import Account from "../../models/account.model.js";
import Role from "../../models/role.model.js";
import { hashPassword, generateToken } from "../../helpers/generate.helper.js";

// [GET] /api/admin/accounts  – Danh sách tài khoản
export const index = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { deleted: false },
      attributes: { exclude: ["password", "token"] },
      raw: true,
    });

    // Gắn tên role vào từng account
    for (const acc of accounts) {
      if (acc.role_id) {
        const role = await Role.findOne({ where: { id: acc.role_id, deleted: false }, raw: true });
        acc.role = role ? { id: role.id, title: role.title } : null;
      } else {
        acc.role = null;
      }
    }

    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [GET] /api/admin/accounts/:id  – Chi tiết tài khoản
export const detail = async (req, res) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, deleted: false },
      attributes: { exclude: ["password", "token"] },
      raw: true,
    });
    if (!account) return res.status(404).json({ code: "error", message: "Không tìm thấy tài khoản" });

    if (account.role_id) {
      const role = await Role.findOne({ where: { id: account.role_id, deleted: false }, raw: true });
      account.role = role ? { id: role.id, title: role.title } : null;
    }

    res.json({ account });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [POST] /api/admin/accounts/create  – Tạo tài khoản mới
export const createPost = async (req, res) => {
  try {
    const { fullName, email, password, phone, role_id, status } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ code: "error", message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existing = await Account.findOne({ where: { email, deleted: false } });
    if (existing) {
      return res.status(400).json({ code: "error", message: `Email ${email} đã tồn tại` });
    }

    await Account.create({
      fullName,
      email,
      password: hashPassword(password),
      token: generateToken(),
      phone: phone || "",
      role_id: role_id ? parseInt(role_id) : null,
      status: status || "active",
    });

    res.json({ code: "success", message: "Tạo tài khoản thành công" });
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [PATCH] /api/admin/accounts/:id  – Cập nhật tài khoản
export const editPatch = async (req, res) => {
  try {
    const updateData = {};
    const { fullName, email, password, phone, role_id, status } = req.body;

    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (role_id !== undefined) updateData.role_id = role_id ? parseInt(role_id) : null;

    // Chỉ hash password nếu có nhập mới
    if (password) {
      updateData.password = hashPassword(password);
    }

    await Account.update(updateData, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Cập nhật tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [DELETE] /api/admin/accounts/:id  – Xóa tài khoản (soft delete)
export const deletePatch = async (req, res) => {
  try {
    await Account.update({ deleted: true, deletedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
