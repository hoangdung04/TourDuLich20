import { Router } from "express";
import { categoryRoutes } from "./category.route.js";
import { tourRoutes } from "./tour.route.js";
import { uploadRoutes } from "./upload.route.js";
import { authRoutes } from "./auth.route.js";
import { roleRoutes } from "./role.route.js";
import { accountRoutes } from "./account.route.js";
import { orderRoutes } from "./order.route.js";
import { dashboardRoutes } from "./dashboard.route.js";
import { chatRoutes } from "./chat.route.js";
import { articleRoutes } from "./article.route.js";

const router = Router();

// Auth (đăng nhập / đăng xuất) – không cần prefix /admin
router.use("/auth", authRoutes);

// Các routes quản lý (cần đăng nhập + phân quyền)
router.use("/dashboard", dashboardRoutes);
router.use("/categories", categoryRoutes);
router.use("/tours", tourRoutes);
router.use("/upload", uploadRoutes);
router.use("/roles", roleRoutes);
router.use("/accounts", accountRoutes);
router.use("/orders", orderRoutes);
router.use("/chat", chatRoutes);
router.use("/articles", articleRoutes);

export const adminRoutes = router;
