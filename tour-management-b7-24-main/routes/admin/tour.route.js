import { Router } from "express";
import * as controller from "../../controllers/admin/tour.controller.js";
import multer from "multer";
import { uploadFields } from "../../middlewares/admin/uploadCloud.middleware.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";
import { checkPermission } from "../../middlewares/admin/permission.middleware.js";

const router = Router();
const upload = multer();

// Tất cả routes cần đăng nhập
router.use(requireAuth);

// [GET] /api/admin/tours  – Danh sách tour
router.get("/", checkPermission("tours_view"), controller.index);

// [GET] /api/admin/tours/categories  – Lấy danh mục cho form tour
router.get("/categories", checkPermission("tours_view"), controller.getCategories);

// [POST] /api/admin/tours/create  – Tạo tour mới
router.post("/create", upload.fields([{ name: 'images', maxCount: 10 }]), uploadFields, checkPermission("tours_create"), controller.createPost);

// [GET] /api/admin/tours/:id  – Chi tiết tour
router.get("/:id", checkPermission("tours_view"), controller.detail);

// [PATCH] /api/admin/tours/:id  – Sửa tour
router.patch("/:id", upload.fields([{ name: "images", maxCount: 10 }]), uploadFields, checkPermission("tours_edit"), controller.editPatch);

// [DELETE] /api/admin/tours/:id  – Xóa tour
router.delete("/:id", checkPermission("tours_delete"), controller.deletePatch);

export const tourRoutes = router;

