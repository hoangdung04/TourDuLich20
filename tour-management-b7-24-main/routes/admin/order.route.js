import { Router } from "express";
import * as controller from "../../controllers/admin/order.controller.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";
import { checkPermission } from "../../middlewares/admin/permission.middleware.js";

const router = Router();

router.use(requireAuth);

// [GET] /api/admin/orders  – Danh sách đơn hàng
router.get("/", checkPermission("orders_view"), controller.index);

// [GET] /api/admin/orders/:id  – Chi tiết đơn hàng
router.get("/:id", checkPermission("orders_view"), controller.detail);

// [PATCH] /api/admin/orders/:id/status  – Cập nhật trạng thái đơn hàng
router.patch("/:id/status", checkPermission("orders_edit"), controller.updateStatus);

// [DELETE] /api/admin/orders/:id  – Xóa đơn hàng (soft delete)
router.delete("/:id", checkPermission("orders_delete"), controller.deletePatch);

export const orderRoutes = router;
