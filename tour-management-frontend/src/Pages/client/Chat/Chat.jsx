import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, List, Typography, Avatar } from "antd";
import { SendOutlined, UserOutlined, PictureOutlined, SmileOutlined, CheckOutlined } from "@ant-design/icons";
import { Popover, Upload } from "antd";
import { io } from "socket.io-client";
import { getToken, getUser } from "../../../utils/auth";

const { Text } = Typography;
// Kết nối Socket tự động không cần auth
const socket = io("http://localhost:3001");

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState([]); // Lưu mảng nhiều ảnh
  const [typingUser, setTypingUser] = useState(""); // Ai đang gõ
  const [roomId, setRoomId] = useState(""); // Lưu ID phòng chat riêng
  const [seenStatus, setSeenStatus] = useState(null); // Trạng thái đã xem
  const typingTimeoutRef = useRef(null); // Quản lý thời gian dừng gõ
  const messagesEndRef = useRef(null); // Ref để tự động cuộn
  // Callback ref: Gắn sự kiện khi emoji-picker xuất hiện trong DOM
  const emojiPickerCallback = (node) => {
    if (node && !node._emojiListenerAdded) {
      node.addEventListener("emoji-click", (event) => {
        setInputValue((prev) => prev + event.detail.unicode);
      });
      node._emojiListenerAdded = true; // Tránh gắn trùng
    }
  };

  // Hàm xử lý khi chọn nhiều ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Xóa 1 ảnh khỏi danh sách chuẩn bị gửi
  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };



  // Hàm tự động cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cuộn mỗi khi danh sách messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gọi API (CSR) để lấy tin nhắn khi trang vừa tải xong
  useEffect(() => {
    fetch("http://localhost:3001/api/chat", {
      headers: {
        "Authorization": `Bearer ${getToken()}`
      },
      cache: "no-store"
    })
      .then((res) => {
        if (res.status === 401) {
          setMessages([{ user: "Admin", content: "Bạn cần đăng nhập để xem lịch sử Chat!" }]);
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (data.code === "success" && data.messages) {
          setMessages(data.messages);
          if (data.room_id) {
            setRoomId(data.room_id);
            socket.emit("CLIENT_JOIN_ROOM", data.room_id);
            // Đánh dấu đã đọc khi mở chat
            socket.emit("CLIENT_SEEN", { room_id: data.room_id, seenBy: "User" });
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải chat:", err);
      });

    // --- LOGIC SOCKET.IO ---
    socket.on("SERVER_SEND_MESSAGE", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      setTypingUser("");
      setSeenStatus(null); // Reset seen khi có tin mới
      // Tự động đánh dấu đã đọc
      socket.emit("CLIENT_SEEN", { room_id: data.room_id, seenBy: "User" });
    });

    socket.on("SERVER_RETURN_TYPING", (data) => {
      if (data.type === "show") {
        setTypingUser(`${data.fullName} đang gõ...`);
      } else {
        setTypingUser("");
      }
    });

    // Lắng nghe trạng thái "Đã xem"
    socket.on("SERVER_SEEN_STATUS", (data) => {
      setSeenStatus(data);
    });

    // Dọn dẹp kết nối khi người dùng rời khỏi trang Chat
    return () => {
      socket.off("SERVER_SEND_MESSAGE");
      socket.off("SERVER_RETURN_TYPING");
      socket.off("SERVER_SEEN_STATUS");
    };
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() && selectedImages.length === 0) return;

    // Lấy thông tin người dùng đang đăng nhập
    const currentUser = getUser();
    const userId = currentUser ? currentUser.id : 0;
    const userName = currentUser ? currentUser.fullName : "Khách";

    const newMsg = {
      user_id: userId,
      user: userName,
      content: inputValue,
      images: selectedImages, // Gửi toàn bộ mảng ảnh
      room_id: roomId // Kèm theo ID phòng
    };

    // 1. Cập nhật giao diện ngay lập tức cho mình thấy
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setSelectedImages([]); // Xóa danh sách ảnh sau khi gửi

    // 2. Gửi tin nhắn qua Socket.io lên Backend
    socket.emit("CLIENT_SEND_MESSAGE", newMsg);
    socket.emit("CLIENT_SEND_TYPING", { userId, fullName: userName, type: "hidden", room_id: roomId });
    setSeenStatus(null); // Reset seen khi gửi tin mới
  };

  // Hàm xử lý sự kiện đang gõ
  const handleTyping = (e) => {
    setInputValue(e.target.value);

    const currentUser = getUser();
    if (!currentUser) return;

    // Gửi thông báo đang gõ
    socket.emit("CLIENT_SEND_TYPING", {
      userId: currentUser.id,
      fullName: currentUser.fullName,
      type: "show",
      room_id: roomId
    });

    // Reset timeout cũ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Nếu dừng gõ 5 giây thì báo ngừng gõ
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("CLIENT_SEND_TYPING", {
        userId: currentUser.id,
        fullName: currentUser.fullName,
        type: "hidden",
        room_id: roomId
      });
    }, 5000);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <Card
        title={<span style={{ fontSize: 18, fontWeight: 600 }}>Hỗ trợ trực tuyến</span>}
        variant="borderless"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", borderRadius: 16 }}
      >
        {/* Khu vực hiển thị tin nhắn */}
        <div
          style={{
            height: 400,
            overflowY: "auto",
            marginBottom: 20,
            padding: 15,
            backgroundColor: "#f5f6fa",
            borderRadius: 12,
          }}
        >
          <List
            dataSource={messages}
            renderItem={(msg, index) => {
              // Kiểm tra xem tin nhắn có phải của mình không (dựa vào user_id)
              const currentUser = getUser();
              const isMe = msg.user_id === (currentUser ? currentUser.id : null);
              const isLastMessage = index === messages.length - 1;

              // --- XỬ LÝ ẢNH AN TOÀN TRÁNH LỖI TRẮNG MÀN HÌNH ---
              let imageArray = [];
              if (msg.images) {
                if (Array.isArray(msg.images)) {
                  imageArray = msg.images;
                } else if (typeof msg.images === "string") {
                  try {
                    const parsed = JSON.parse(msg.images);
                    imageArray = Array.isArray(parsed) ? parsed : [msg.images];
                  } catch {
                    imageArray = [msg.images];
                  }
                }
              }

              return (
                <List.Item style={{ borderBottom: "none", padding: "8px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    {/* Hiển thị tên người gửi */}
                    {!isMe && (
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 45, marginBottom: 4 }}>
                        {msg.user}
                      </Text>
                    )}

                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          display: "flex",
                          flexDirection: isMe ? "row-reverse" : "row",
                          alignItems: "flex-end",
                          gap: 8,
                        }}
                      >
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: isMe ? "#00b96b" : "#1890ff" }}
                        />
                        <div
                          style={{
                            backgroundColor: isMe ? "#e6f7ff" : "#ffffff",
                            padding: "10px 16px",
                            borderRadius: 20,
                            borderBottomRightRadius: isMe ? 4 : 20,
                            borderBottomLeftRadius: !isMe ? 4 : 20,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                            wordBreak: "break-word"
                          }}
                        >
                          {/* Hiển thị danh sách nhiều ảnh nếu có */}
                          {imageArray.length > 0 && (
                            <div style={{ marginBottom: msg.content ? 8 : 0, display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {imageArray.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt="attachment"
                                  style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8, objectFit: "cover" }}
                                />
                              ))}
                            </div>
                          )}
                          {/* Hiển thị nội dung tin nhắn */}
                          {msg.content && <Text>{msg.content}</Text>}
                        </div>
                      </div>
                    </div>
                    {/* Trạng thái Đã xem - chỉ hiện ở tin nhắn cuối cùng của mình */}
                    {isMe && isLastMessage && seenStatus && seenStatus.seenBy === "Admin" && (
                      <div style={{ fontSize: 11, color: "#52c41a", marginTop: 4, marginRight: 45, display: "flex", alignItems: "center", gap: 3 }}>
                        <CheckOutlined style={{ fontSize: 10 }} /><CheckOutlined style={{ fontSize: 10, marginLeft: -6 }} /> Đã xem
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />

          {/* Hiệu ứng Đang gõ... */}
          {typingUser && (
            <div style={{ padding: "0 10px", marginBottom: 10 }}>
              <Text type="secondary" italic style={{ fontSize: 13, color: "#8c8c8c" }}>
                <span className="typing-dot" style={{ display: "inline-block", width: 4, height: 4, backgroundColor: "#8c8c8c", borderRadius: "50%", marginRight: 4, animation: "blink 1.4s infinite both" }}></span>
                <span className="typing-dot" style={{ display: "inline-block", width: 4, height: 4, backgroundColor: "#8c8c8c", borderRadius: "50%", marginRight: 4, animation: "blink 1.4s infinite both", animationDelay: "0.2s" }}></span>
                <span className="typing-dot" style={{ display: "inline-block", width: 4, height: 4, backgroundColor: "#8c8c8c", borderRadius: "50%", marginRight: 8, animation: "blink 1.4s infinite both", animationDelay: "0.4s" }}></span>
                {typingUser}
              </Text>
              <style>
                {`
                  @keyframes blink {
                    0% { opacity: 0.2; }
                    20% { opacity: 1; }
                    100% { opacity: 0.2; }
                  }
                `}
              </style>
            </div>
          )}

          {/* Điểm neo để tự động cuộn xuống */}
          <div ref={messagesEndRef} />
        </div>

        {/* Hiển thị danh sách ảnh đang chọn (Preview) */}
        {selectedImages.length > 0 && (
          <div style={{ marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {selectedImages.map((img, index) => (
              <div key={index} style={{ position: "relative", display: "inline-block" }}>
                <img src={img} alt="preview" style={{ height: 60, width: 60, objectFit: "cover", borderRadius: 8 }} />
                <Button
                  size="small"
                  danger
                  shape="circle"
                  style={{ position: "absolute", top: -5, right: -5, width: 20, height: 20, minWidth: 20 }}
                  onClick={() => removeImage(index)}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Khu vực nhập tin nhắn */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {/* Nút gửi ảnh (Đã bật multiple để chọn nhiều ảnh 1 lúc) */}
          <div style={{ paddingBottom: 8 }}>
            <label htmlFor="upload-image" style={{ cursor: "pointer", fontSize: 24, color: "#1890ff" }}>
              <PictureOutlined />
            </label>
            <input
              id="upload-image"
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

          {/* Bảng Emoji (Dùng Web Component emoji-picker-element) */}
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
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={handleTyping}
            onPressEnter={(e) => {
              // Nhấn Enter để gửi, nhấn Shift+Enter để xuống dòng
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ borderRadius: 20, flex: 1, padding: "8px 12px" }}
          />
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={handleSend}
            style={{ borderRadius: 24, padding: "0 24px", height: 40 }}
          >
            Gửi
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
