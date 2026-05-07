import { Router } from "express";
import * as controller from "../../controllers/admin/auth.controller.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";

const router = Router();

// [POST] /api/admin/auth/login  – Đăng nhập (không cần xác thực)
router.post("/login", controller.login);

// [POST] /api/admin/auth/logout  – Đăng xuất (cần xác thực)
router.post("/logout", requireAuth, controller.logout);

// [GET] /api/admin/auth/me  – Thông tin tài khoản hiện tại
router.get("/me", requireAuth, controller.me);

export const authRoutes = router;
