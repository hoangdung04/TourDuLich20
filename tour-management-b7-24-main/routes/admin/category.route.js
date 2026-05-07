import { Router } from "express";
import * as controller from "../../controllers/admin/category.controller.js";
import multer from "multer";
import { uploadSingle } from "../../middlewares/admin/uploadCloud.middleware.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";
import { checkPermission } from "../../middlewares/admin/permission.middleware.js";

const router = Router();
const upload = multer();

// Tất cả routes cần đăng nhập
router.use(requireAuth);

// [GET] /api/admin/categories  – Danh sách danh mục
router.get("/", checkPermission("categories_view"), controller.index);

// [GET] /api/admin/categories/:id  – Chi tiết danh mục
router.get("/:id", checkPermission("categories_view"), controller.detail);

// [POST] /api/admin/categories/create  – Tạo danh mục
router.post("/create", upload.single("image"), uploadSingle, checkPermission("categories_create"), controller.createPost);

// [PATCH] /api/admin/categories/:id  – Sửa danh mục
router.patch("/:id", upload.single("image"), uploadSingle, checkPermission("categories_edit"), controller.editPatch);

// [DELETE] /api/admin/categories/:id  – Xóa danh mục
router.delete("/:id", checkPermission("categories_delete"), controller.deletePatch);

export const categoryRoutes = router;

