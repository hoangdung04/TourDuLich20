import { Router } from "express";
import * as controller from "../../controllers/admin/chat.controller.js";
import { requireAuth } from "../../middlewares/admin/auth.middleware.js";

const router = Router();

// Lấy danh sách các phòng chat
router.get("/rooms", requireAuth, controller.getRooms);

// Lấy tin nhắn của 1 phòng chat cụ thể
router.get("/rooms/:roomId", requireAuth, controller.getRoomMessages);

// Đánh dấu phòng đã đọc
router.patch("/rooms/:roomId/read", requireAuth, controller.markAsRead);

export const chatRoutes = router;
