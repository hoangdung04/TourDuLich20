import { Router } from "express";
import { categoryRoutes } from "./category.route.js";
import { tourRoutes } from "./tour.route.js";
import { uploadRoutes } from "./upload.route.js";
import { authRoutes } from "./auth.route.js";
import { roleRoutes } from "./role.route.js";
import { accountRoutes } from "./account.route.js";

const router = Router();

// Auth (đăng nhập / đăng xuất) – không cần prefix /admin
router.use("/auth", authRoutes);

// Các routes quản lý (cần đăng nhập + phân quyền)
router.use("/categories", categoryRoutes);
router.use("/tours", tourRoutes);
router.use("/upload", uploadRoutes);
router.use("/roles", roleRoutes);
router.use("/accounts", accountRoutes);

export const adminRoutes = router;

