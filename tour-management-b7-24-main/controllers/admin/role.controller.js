import Role from "../../models/role.model.js";

// [GET] /api/admin/roles  – Danh sách vai trò
export const index = async (req, res) => {
  try {
    const roles = await Role.findAll({ where: { deleted: false }, raw: false });
    res.json({ roles: roles.map(r => ({
      id: r.id, title: r.title, description: r.description,
      status: r.status, permissions: r.permissions,
    })) });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [GET] /api/admin/roles/:id  – Chi tiết vai trò
export const detail = async (req, res) => {
  try {
    const role = await Role.findOne({ where: { id: req.params.id, deleted: false } });
    if (!role) return res.status(404).json({ code: "error", message: "Không tìm thấy vai trò" });
    res.json({ role: { id: role.id, title: role.title, description: role.description, status: role.status, permissions: role.permissions } });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [POST] /api/admin/roles/create  – Tạo vai trò mới
export const createPost = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    if (!title) return res.status(400).json({ code: "error", message: "Tên vai trò không được để trống" });

    await Role.create({
      title,
      description: description || "",
      status: status || "active",
      permissions: [],
    });
    res.json({ code: "success", message: "Tạo vai trò thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [PATCH] /api/admin/roles/:id  – Sửa vai trò
export const editPatch = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    await Role.update(updateData, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Cập nhật vai trò thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [DELETE] /api/admin/roles/:id  – Xóa vai trò (soft delete)
export const deletePatch = async (req, res) => {
  try {
    await Role.update({ deleted: true, deletedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ code: "success", message: "Xóa vai trò thành công" });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [GET] /api/admin/roles/permissions  – Lấy tất cả role để phân quyền
export const permissions = async (req, res) => {
  try {
    const roles = await Role.findAll({ where: { deleted: false }, raw: false });
    res.json({
      roles: roles.map(r => ({
        id: r.id, title: r.title, permissions: r.permissions,
      })),
      // Danh sách tất cả quyền trong hệ thống
      allPermissions: [
        { key: "tours_view",       label: "Xem danh sách tour" },
        { key: "tours_create",     label: "Tạo tour mới" },
        { key: "tours_edit",       label: "Sửa tour" },
        { key: "tours_delete",     label: "Xóa tour" },
        { key: "categories_view",   label: "Xem danh mục" },
        { key: "categories_create", label: "Tạo danh mục" },
        { key: "categories_edit",   label: "Sửa danh mục" },
        { key: "categories_delete", label: "Xóa danh mục" },
        { key: "accounts_view",    label: "Xem tài khoản" },
        { key: "accounts_create",  label: "Tạo tài khoản" },
        { key: "accounts_edit",    label: "Sửa tài khoản" },
        { key: "accounts_delete",  label: "Xóa tài khoản" },
        { key: "roles_view",       label: "Xem vai trò" },
        { key: "roles_create",     label: "Tạo vai trò" },
        { key: "roles_edit",       label: "Sửa vai trò" },
        { key: "roles_delete",     label: "Xóa vai trò" },
        { key: "roles_permissions", label: "Phân quyền" },
        { key: "orders_view",      label: "Xem đơn hàng" },
        { key: "orders_edit",      label: "Cập nhật đơn hàng" },
        { key: "orders_delete",    label: "Xóa đơn hàng" },
      ],
    });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

// [PATCH] /api/admin/roles/permissions  – Lưu phân quyền cho tất cả role
// Body: { permissions: [{ roleId: 1, permissions: ["tours_view", "tours_create"] }] }
export const permissionsPatch = async (req, res) => {
  try {
    const { permissions: permissionsData } = req.body;

    if (!Array.isArray(permissionsData)) {
      return res.status(400).json({ code: "error", message: "Dữ liệu không hợp lệ" });
    }

    for (const item of permissionsData) {
      await Role.update(
        { permissions: item.permissions },
        { where: { id: item.roleId } }
      );
    }

    res.json({ code: "success", message: "Cập nhật phân quyền thành công" });
  } catch (error) {
    console.error("Permissions patch error:", error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
