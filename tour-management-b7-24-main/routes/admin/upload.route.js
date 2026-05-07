import { Router } from "express";
import * as controller from "../../controllers/admin/upload.controller.js";
import multer from "multer";
import { uploadSingle } from "../../middlewares/admin/uploadCloud.middleware.js";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), uploadSingle, controller.index);

export const uploadRoutes = router;
