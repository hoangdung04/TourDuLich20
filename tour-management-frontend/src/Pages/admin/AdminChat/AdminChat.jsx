import React, { useState, useEffect, useRef } from "react";
import { Input, Button, List, Typography, Avatar, Layout, Spin, Badge, notification, Popover } from "antd";
import { SendOutlined, UserOutlined, MessageOutlined, PictureOutlined, SmileOutlined, CheckOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import { getToken, getUser } from "../../../utils/auth";

const { Text } = Typography;
const { Sider, Content } = Layout;
const socket = io("http://localhost:3001");

const AdminChat = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [seenStatus, setSeenStatus] = useState(null); // { seenBy, seenAt }

  const activeRoomIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Callback ref: Gắn sự kiện khi emoji-picker xuất hiện trong DOM
  const emojiPickerCallback = (node) => {
    if (node && !node._emojiListenerAdded) {
      node.addEventListener("emoji-click", (event) => {
        setInputValue((prev) => prev + event.detail.unicode);
      });
      node._emojiListenerAdded = true; // Tránh gắn trùng
    }
  };

  // Xử lý chọn nhiều ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImages((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // 1. Tải danh sách phòng chat + lắng nghe socket
  useEffect(() => {
    fetchRooms();

    // Lắng nghe tin nhắn mới
    socket.on("SERVER_SEND_MESSAGE", (data) => {
      if (data.room_id === activeRoomIdRef.current) {
        setMessages((prev) => [...prev, data]);
        // Tự động đánh dấu đã đọc vì Admin đang mở phòng này
        socket.emit("CLIENT_SEEN", { room_id: data.room_id, seenBy: "Admin" });
      } else {
        // Tin nhắn từ phòng khác => hiện notification
        notification.info({
          message: `Tin nhắn mới từ ${data.user}`,
          description: data.content || "[Hình ảnh]",
          placement: "topRight",
          duration: 4
        });
      }
      setTypingUser("");
      fetchRooms();
    });

    // Typing indicator
    socket.on("SERVER_RETURN_TYPING", (data) => {
      if (data.room_id === activeRoomIdRef.current) {
        if (data.type === "show") {
          setTypingUser(`${data.fullName} đang gõ...`);
        } else {
          setTypingUser("");
        }
      }
    });

    // Trạng thái "Đã xem"
    socket.on("SERVER_SEEN_STATUS", (data) => {
      if (data.room_id === activeRoomIdRef.current) {
        setSeenStatus(data);
      }
    });

    return () => {
      socket.off("SERVER_SEND_MESSAGE");
      socket.off("SERVER_RETURN_TYPING");
      socket.off("SERVER_SEEN_STATUS");
    };
  }, []);

  const fetchRooms = () => {
    fetch("http://localhost:3001/api/admin/chat/rooms", {
      headers: { "Authorization": `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setRooms(data.rooms);
          setLoadingRooms(false);
          data.rooms.forEach(room => socket.emit("CLIENT_JOIN_ROOM", room.room_id));
        } else {
          setLoadingRooms(false);
        }
      })
      .catch((err) => { console.error(err); setLoadingRooms(false); });
  };

  // 2. Tải tin nhắn khi click vào 1 phòng
  useEffect(() => {
    if (!activeRoomId) return;

    fetch(`http://localhost:3001/api/admin/chat/rooms/${activeRoomId}`, {
      headers: { "Authorization": `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setMessages(data.messages);
          activeRoomIdRef.current = activeRoomId;
          socket.emit("CLIENT_JOIN_ROOM", activeRoomId);
          // Đánh dấu đã đọc
          socket.emit("CLIENT_SEEN", { room_id: activeRoomId, seenBy: "Admin" });
          setSeenStatus(null);
          // Cập nhật lại danh sách phòng (để xóa badge)
          fetchRooms();
        }
      })
      .catch(console.error);
  }, [activeRoomId]);

  // Hàm gửi tin nhắn
  const handleSend = () => {
    if (!inputValue.trim() && selectedImages.length === 0) return;
    if (!activeRoomId) return;

    const currentUser = getUser();
    const newMsg = {
      user_id: currentUser.id,
      user: currentUser.fullName,
      content: inputValue,
      images: selectedImages,
      room_id: activeRoomId,
      senderType: 'Admin'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setSelectedImages([]);
    setSeenStatus(null); // Reset seen khi gửi tin nhắn mới

    socket.emit("CLIENT_SEND_MESSAGE", newMsg);
    socket.emit("CLIENT_SEND_TYPING", { userId: currentUser.id, fullName: currentUser.fullName, type: "hidden", room_id: activeRoomId });
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    if (!activeRoomId) return;

    const currentUser = getUser();
    socket.emit("CLIENT_SEND_TYPING", { userId: currentUser.id, fullName: currentUser.fullName, type: "show", room_id: activeRoomId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("CLIENT_SEND_TYPING", { userId: currentUser.id, fullName: currentUser.fullName, type: "hidden", room_id: activeRoomId });
    }, 5000);
  };

  return (
    <Layout style={{ height: "calc(100vh - 100px)", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* CSS cho typing animation */}
      <style>{`
        @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
        .typing-dot { display: inline-block; width: 5px; height: 5px; background-color: #8c8c8c; border-radius: 50%; margin-right: 3px; animation: blink 1.4s infinite both; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .room-item:hover { background: #f0f5ff !important; }
      `}</style>

      {/* Cột trái: Danh sách phòng */}
      <Sider width={320} style={{ background: "#f8f9fa", borderRight: "1px solid #f0f0f0", overflowY: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e8e8", fontWeight: "bold", fontSize: 16 }}>
          💬 Tin nhắn khách hàng
        </div>
        {loadingRooms ? <div style={{ textAlign: 'center', marginTop: 50 }}><Spin /></div> : (
          rooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#bfbfbf" }}>Chưa có cuộc trò chuyện nào</div>
          ) : (
            <List
              dataSource={rooms}
              renderItem={(room) => {
                const hasUnread = room.unreadCountAdmin > 0;
                return (
                  <div
                    className="room-item"
                    key={room.room_id}
                    onClick={() => {
                      setActiveRoomId(room.room_id);
                      activeRoomIdRef.current = room.room_id;
                    }}
                    style={{
                      padding: "14px 20px",
                      cursor: "pointer",
                      background: activeRoomId === room.room_id ? "#e6f7ff" : "transparent",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Badge count={hasUnread ? room.unreadCountAdmin : 0} size="small" offset={[-2, 2]}>
                        <Avatar icon={<UserOutlined />} src={room.userInfo?.avatar} style={{ backgroundColor: "#00b96b" }} />
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: hasUnread ? 700 : 500, color: hasUnread ? "#000" : "#333" }}>
                          {room.userInfo?.fullName || "Khách hàng"}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: hasUnread ? "#333" : "#8c8c8c",
                          fontWeight: hasUnread ? 600 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 200
                        }}>
                          {room.lastMessage || "Chưa có tin nhắn"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )
        )}
      </Sider>

      {/* Cột phải: Khung chat */}
      <Content style={{ display: "flex", flexDirection: "column" }}>
        {!activeRoomId ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#bfbfbf" }}>
            <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <h3>Chọn một khách hàng để bắt đầu trò chuyện</h3>
          </div>
        ) : (
          <>
            {/* Header phòng chat */}
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #f0f0f0", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#00b96b" }} />
              {rooms.find(r => r.room_id === activeRoomId)?.userInfo?.fullName || "Khách hàng"}
            </div>

            {/* Vùng tin nhắn */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, backgroundColor: "#fdfdfd" }}>
              <List
                dataSource={messages}
                renderItem={(msg, index) => {
                  const isAdmin = msg.senderType === "Admin";
                  const isLastMessage = index === messages.length - 1;

                  let imageArray = [];
                  if (msg.images) {
                    if (Array.isArray(msg.images)) imageArray = msg.images;
                    else if (typeof msg.images === "string") {
                      try {
                        const parsed = JSON.parse(msg.images);
                        imageArray = Array.isArray(parsed) ? parsed : [msg.images];
                      } catch (e) { imageArray = [msg.images]; }
                    }
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start", marginBottom: 16 }}>
                      {!isAdmin && <Text type="secondary" style={{ fontSize: 12, marginLeft: 45, marginBottom: 4 }}>{msg.user}</Text>}
                      <div style={{ display: "flex", flexDirection: isAdmin ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, maxWidth: "70%" }}>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: isAdmin ? "#1890ff" : "#00b96b" }} />
                        <div style={{
                          backgroundColor: isAdmin ? "#1890ff" : "#f0f2f5",
                          color: isAdmin ? "#fff" : "#000",
                          padding: "10px 16px",
                          borderRadius: 20,
                          borderBottomRightRadius: isAdmin ? 4 : 20,
                          borderBottomLeftRadius: !isAdmin ? 4 : 20,
                          wordBreak: "break-word"
                        }}>
                          {imageArray.length > 0 && (
                            <div style={{ marginBottom: msg.content ? 8 : 0, display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {imageArray.map((img, idx) => <img key={idx} src={img} alt="attachment" style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8, objectFit: "cover" }} />)}
                            </div>
                          )}
                          {msg.content && <Text style={{ color: "inherit" }}>{msg.content}</Text>}
                        </div>
                      </div>
                      {/* Trạng thái Đã xem - chỉ hiện ở tin nhắn cuối cùng của Admin */}
                      {isAdmin && isLastMessage && seenStatus && seenStatus.seenBy === "User" && (
                        <div style={{ fontSize: 11, color: "#52c41a", marginTop: 4, marginRight: 45, display: "flex", alignItems: "center", gap: 3 }}>
                          <CheckOutlined style={{ fontSize: 10 }} /><CheckOutlined style={{ fontSize: 10, marginLeft: -6 }} /> Đã xem
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* Hiệu ứng Đang gõ... (giống Client) */}
              {typingUser && (
                <div style={{ padding: "0 10px", marginBottom: 10 }}>
                  <Text type="secondary" italic style={{ fontSize: 13, color: "#8c8c8c" }}>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    {" "}{typingUser}
                  </Text>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Preview ảnh đang chọn */}
            {selectedImages.length > 0 && (
              <div style={{ padding: "10px 15px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selectedImages.map((img, index) => (
                  <div key={index} style={{ position: "relative", display: "inline-block" }}>
                    <img src={img} alt="preview" style={{ height: 60, width: 60, objectFit: "cover", borderRadius: 8 }} />
                    <Button size="small" danger shape="circle" style={{ position: "absolute", top: -5, right: -5, width: 20, height: 20, minWidth: 20, fontSize: 10 }} onClick={() => removeImage(index)}>X</Button>
                  </div>
                ))}
              </div>
            )}

            {/* Vùng nhập liệu */}
            <div style={{ padding: 15, borderTop: "1px solid #f0f0f0", background: "#fff", display: "flex", gap: 10, alignItems: "flex-end" }}>
              {/* Nút gửi ảnh */}
              <div style={{ paddingBottom: 8 }}>
                <label htmlFor="admin-upload-image" style={{ cursor: "pointer", fontSize: 22, color: "#1890ff" }}>
                  <PictureOutlined />
                </label>
                <input id="admin-upload-image" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
              </div>

              {/* Bảng Emoji */}
              <Popover
                content={
                  <div style={{ width: "300px", height: "400px", overflow: "hidden" }}>
                    <emoji-picker ref={emojiPickerCallback} style={{ width: "100%", height: "100%" }}></emoji-picker>
                  </div>
                }
                trigger="click"
                placement="topLeft"
              >
                <div style={{ paddingBottom: 8 }}>
                  <SmileOutlined style={{ fontSize: 22, color: "#faad14", cursor: "pointer" }} />
                </div>
              </Popover>

              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn trả lời..."
                value={inputValue}
                onChange={handleTyping}
                onPressEnter={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                style={{ borderRadius: 20, flex: 1 }}
              />
              <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleSend} style={{ borderRadius: 20, padding: "0 20px" }}>Gửi</Button>
            </div>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default AdminChat;
