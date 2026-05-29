import Chat from "../../models/chat.model.js";
import Account from "../../models/account.model.js";
import RoomChat from "../../models/room-chat.model.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.js";

// Định nghĩa quan hệ (Thêm constraints: false để không bị lỗi khóa ngoại với các tin nhắn cũ có user_id = 0)
Chat.belongsTo(Account, {
    foreignKey: "user_id",
    as: "userInfo",
    constraints: false
});

// [GET] /api/chat - Lấy lịch sử tin nhắn từ database
export const index = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const roomChatId = `client_${userId}`; // ID phòng mặc định của khách

        // 1. Kiểm tra hoặc Tạo mới RoomChat cho Khách hàng này
        await RoomChat.findOrCreate({
            where: { room_id: roomChatId },
            defaults: {
                room_id: roomChatId,
                user_id: userId,
                status: "active"
            }
        });

        // 3. Lấy lịch sử tin nhắn của phòng này (bao gồm cả tin cũ vừa được gán)
        const chats = await Chat.findAll({
            where: {
                room_chat_id: roomChatId,
                deleted: false
            },
            include: [{
                model: Account,
                as: "userInfo",
                attributes: ["fullName"] // Chỉ lấy tên
            }],
            order: [
                ["createdAt", "ASC"]
            ],
            limit: 50
        });

        // Định dạng lại dữ liệu cho Frontend dễ đọc
        const messages = chats.map(chat => ({
            id: chat.id,
            user_id: chat.user_id,
            user: chat.userInfo ? chat.userInfo.fullName : "Khách",
            content: chat.content,
            images: chat.images,
            createdAt: chat.createdAt,

        }));

        res.json({
            code: "success",
            room_id: roomChatId, // Trả về room_id để React biết mà tham gia phòng
            messages: messages
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// KHỞI TẠO SOCKET (Bắt buộc tách riêng với React)
// ==========================================
export const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("⚡ Client kết nối Socket thành công! ID:", socket.id);

        // --- CHO KHÁCH HÀNG THAM GIA VÀO PHÒNG RIÊNG ---
        socket.on("CLIENT_JOIN_ROOM", (roomId) => {
            socket.join(roomId);
            console.log(`🏠 Socket ${socket.id} đã tham gia phòng: ${roomId}`);
        });

        // Lắng nghe tin nhắn từ Client gửi lên
        socket.on("CLIENT_SEND_MESSAGE", async (data) => {
            try {
                // 1. Lưu vào Database
                const newMessage = await Chat.create({
                    user_id: data.user_id || 0,
                    room_chat_id: data.room_id,
                    content: data.content,
                    images: data.images || [],
                    senderType: data.senderType || 'User'
                });

                // 2. Cập nhật RoomChat: lastMessage + tăng unreadCount
                const isAdmin = data.senderType === 'Admin';
                const updateData = {
                    lastMessage: data.content || (data.images?.length ? "[Hình ảnh]" : ""),
                    lastMessageAt: new Date()
                };
                if (isAdmin) {
                    // Admin gửi => tăng unread phía User
                    updateData.unreadCountUser = sequelize.literal('unreadCountUser + 1');
                } else {
                    // User gửi => tăng unread phía Admin
                    updateData.unreadCountAdmin = sequelize.literal('unreadCountAdmin + 1');
                }
                await RoomChat.update(updateData, { where: { room_id: data.room_id } });

                console.log("💾 Đã lưu tin nhắn mới vào phòng", data.room_id, ":", newMessage.content);

                // 3. Trả về cho TẤT CẢ mọi người TRONG PHÒNG ĐÓ (ngoại trừ người gửi)
                socket.to(data.room_id).emit("SERVER_SEND_MESSAGE", {
                    user: data.user,
                    user_id: data.user_id,
                    content: newMessage.content,
                    images: data.images,
                    room_id: data.room_id,
                    senderType: data.senderType || 'User',
                    createdAt: newMessage.createdAt
                });
            } catch (error) {
                console.error("❌ Lỗi lưu tin nhắn:", error);
            }
        });

        // 3. Lắng nghe hiệu ứng "Đang gõ..."
        socket.on("CLIENT_SEND_TYPING", (data) => {
            socket.to(data.room_id).emit("SERVER_RETURN_TYPING", {
                userId: data.userId,
                fullName: data.fullName,
                type: data.type,
                room_id: data.room_id
            });
        });

        // 4. Lắng nghe sự kiện "Đã xem" từ User
        socket.on("CLIENT_SEEN", async (data) => {
            // data = { room_id, seenBy: 'User' | 'Admin' }
            try {
                if (data.seenBy === 'User') {
                    await RoomChat.update({ unreadCountUser: 0 }, { where: { room_id: data.room_id } });
                } else {
                    await RoomChat.update({ unreadCountAdmin: 0 }, { where: { room_id: data.room_id } });
                }
                socket.to(data.room_id).emit("SERVER_SEEN_STATUS", {
                    room_id: data.room_id,
                    seenBy: data.seenBy,
                    seenAt: new Date()
                });
            } catch (error) {
                console.error("❌ Lỗi cập nhật trạng thái Seen:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ Client ngắt kết nối:", socket.id);
        });
    });
};