import express from "express";
import http from "http";
import {
  Server
} from "socket.io";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import {
  fileURLToPath
} from "url";

// ==========================================
// 1. IMPORT CÁC ĐƯỜNG DẪN (ROUTES) & MIDDLEWARES
// ==========================================
import sequelize from "./config/database.js";
import {
  clientRoutes
} from "./routes/client/index.route.js";
import {
  adminRoutes
} from "./routes/admin/index.route.js";
import {
  notFoundHandler,
  errorHandler
} from "./middlewares/error.middleware.js";


// ==========================================
// 2. CẤU HÌNH MÔI TRƯỜNG & ĐƯỜNG DẪN THƯ MỤC
// ==========================================
dotenv.config(); // Lọc các biến môi trường từ file .env
const __filename = fileURLToPath(
  import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 3. KHỞI TẠO EXPRESS APP & SERVER (HTTP)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;
// Bắt buộc phải tạo server HTTP riêng để bọc app Express vào (nếu muốn dùng chung với Socket.io)
const server = http.createServer(app);

// ==========================================
// 4. KHỞI TẠO SOCKET.IO (CHAT REAL-TIME)
// ==========================================
// Khởi tạo Socket.io và gắn vào HTTP Server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Rất quan trọng: Mở khóa CORS cho React (chạy cổng 5173) để nó có thể kết nối Socket
    methods: ["GET", "POST"]
  }
});
global._io = io;
// ==========================================

// ==========================================
// 6. CÁC MIDDLEWARE HỆ THỐNG
// ==========================================
app.use(cors()); // Cho phép React gọi API thông thường
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

// Cấu hình TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

import { chatSocket } from "./controllers/client/chat.controller.js";

// ==========================================
// 8. ĐỊNH TUYẾN (ROUTES API) & SOCKET
// ==========================================
chatSocket(io);
app.use("/api/admin", adminRoutes);
app.use("/api", clientRoutes);

// ==========================================
// 9. XỬ LÝ LỖI (ERROR HANDLING)
// ==========================================
app.use(notFoundHandler); // Bắt lỗi 404
app.use(errorHandler); // Bắt lỗi 500

// ==========================================
// 10. KHỞI ĐỘNG SERVER
// ==========================================
// LƯU Ý LỚN: Phải gọi server.listen (đã chứa cả Express và Socket) thay vì app.listen
server.listen(port, () => {
  console.log(`🚀 Server đang chạy tại port ${port}`); // Auto-restart trigger
});