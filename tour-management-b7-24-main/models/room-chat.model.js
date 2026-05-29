import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RoomChat = sequelize.define("RoomChat", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  // ID của phòng (Ví dụ: "client_15" hoặc 1 mã ngẫu nhiên)
  room_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  // ID của khách hàng tạo phòng này
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Trạng thái của phòng: active (đang chat), closed (đã xong)
  status: {
    type: DataTypes.STRING(50),
    defaultValue: "active",
  },
  // Tin nhắn cuối cùng (hiển thị preview bên danh sách phòng)
  lastMessage: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  // Thời gian tin nhắn cuối
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // Số tin nhắn chưa đọc phía Admin
  unreadCountAdmin: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Số tin nhắn chưa đọc phía User
  unreadCountUser: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Đã xóa chưa (xóa mềm)
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "room_chats",
  timestamps: true, // Tự tạo createdAt, updatedAt
});

// Tự động tạo bảng nếu chưa có (không dùng alter để tránh lỗi duplicate keys)
RoomChat.sync()
  .then(() => console.log("✅ Bảng RoomChat đã được đồng bộ."))
  .catch((err) => console.log("❌ Lỗi đồng bộ bảng RoomChat:", err));

export default RoomChat;
