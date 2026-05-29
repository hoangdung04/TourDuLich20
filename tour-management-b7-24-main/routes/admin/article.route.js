import { Router } from "express";
import * as controller from "../../controllers/admin/article.controller.js";
import multer from "multer";
import { uploadFields } from "../../middlewares/admin/uploadCloud.middleware.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";

const router = Router();
const upload = multer();

// Tất cả routes cần đăng nhập admin
router.use(requireAuth);

// [GET] /api/admin/articles – Danh sách
router.get("/", controller.index);

// [GET] /api/admin/articles/tours – Lấy tours để chọn liên kết
router.get("/tours", controller.getTours);

// [GET] /api/admin/articles/:id – Chi tiết
router.get("/:id", controller.detail);

// [POST] /api/admin/articles/create – Tạo mới
router.post("/create", upload.fields([{ name: "thumbnail", maxCount: 1 }]), uploadFields, controller.createPost);

// [PATCH] /api/admin/articles/:id – Cập nhật
router.patch("/:id", upload.fields([{ name: "thumbnail", maxCount: 1 }]), uploadFields, controller.editPatch);

// [DELETE] /api/admin/articles/:id – Xóa
router.delete("/:id", controller.deletePatch);

export const articleRoutes = router;
