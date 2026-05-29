import {
  DataTypes
} from "sequelize";
import sequelize from "../config/database.js";

const Chat = sequelize.define("Chat", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: true,
    primaryKey: true,
  },
  // ID người gửi (liên kết với bảng accounts)
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // ID phòng chat (để phân biệt các cuộc hội thoại)
  room_chat_id: {
    type: DataTypes.STRING(255),
    defaultValue: "",
  },
  // Nội dung tin nhắn
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Danh sách ảnh đính kèm (lưu dạng JSON)
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  // Đã xóa chưa (xóa mềm)
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Xác định người gửi là ai (User, Admin, AI)
  senderType: {
    type: DataTypes.ENUM('User', 'Admin', 'AI'),
    defaultValue: 'User',
    allowNull: false,
  },
}, {
  tableName: "chats",
  timestamps: true, // Tự tạo createdAt, updatedAt
});

export default Chat;