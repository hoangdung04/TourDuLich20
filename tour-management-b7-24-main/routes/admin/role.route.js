import { Router } from "express";
import * as controller from "../../controllers/admin/role.controller.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";
import { checkPermission } from "../../middlewares/admin/permission.middleware.js";

const router = Router();

// Tất cả routes cần đăng nhập
router.use(requireAuth);

// [GET] /api/admin/roles  – Danh sách vai trò
router.get("/", checkPermission("roles_view"), controller.index);

// [GET] /api/admin/roles/permissions  – Trang phân quyền (đặt TRƯỚC /:id để không bị nhầm)
router.get("/permissions", checkPermission("roles_permissions"), controller.permissions);

// [PATCH] /api/admin/roles/permissions  – Lưu phân quyền
router.patch("/permissions", checkPermission("roles_permissions"), controller.permissionsPatch);

// [GET] /api/admin/roles/:id  – Chi tiết vai trò
router.get("/:id", checkPermission("roles_view"), controller.detail);

// [POST] /api/admin/roles/create  – Tạo vai trò mới
router.post("/create", checkPermission("roles_create"), controller.createPost);

// [PATCH] /api/admin/roles/:id  – Sửa vai trò
router.patch("/:id", checkPermission("roles_edit"), controller.editPatch);

// [DELETE] /api/admin/roles/:id  – Xóa vai trò
router.delete("/:id", checkPermission("roles_delete"), controller.deletePatch);

export const roleRoutes = router;
