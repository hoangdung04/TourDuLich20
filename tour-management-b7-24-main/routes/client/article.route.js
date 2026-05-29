import { Router } from "express";
import * as controller from "../../controllers/client/article.controller.js";

const router = Router();

// [GET] /api/articles – Danh sách bài viết (public)
router.get("/", controller.index);

// [GET] /api/articles/:slug – Chi tiết bài viết (public)
router.get("/:slug", controller.detail);

export const articleRoutes = router;
