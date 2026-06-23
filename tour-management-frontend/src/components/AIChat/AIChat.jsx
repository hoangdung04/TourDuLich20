import React, { useState, useRef, useEffect } from "react";
import { sendAiChatMessage, createOrder } from "../../services/api";
import { getUser, isLoggedIn } from "../../utils/auth";
import { RobotOutlined, CloseOutlined, SendOutlined, LinkOutlined, DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../utils/cart";
import { message as antdMessage } from "antd";
import "./AIChat.css";

const BookingFormWidget = ({ bookingForm, onSuccess }) => {
  const user = getUser();
  const navigate = useNavigate();
  
  // States for input fields
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [note, setNote] = useState("");
  
  // States for counters
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [visa, setVisa] = useState(0);
  const [singleRoom, setSingleRoom] = useState(0);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [submitting, setSubmitting] = useState(false);

  // Parse price
  const priceSpecial = bookingForm.price_special || 0;

  // Calculate live breakdown
  const priceAdults = priceSpecial * adults;
  const priceChildren = Math.round(priceSpecial * 0.7) * children;
  const priceToddlers = Math.round(priceSpecial * 0.5) * toddlers;
  const priceSeniors = Math.round(priceSpecial * 0.6) * seniors;
  const priceVisa = 1500000 * visa;
  const priceSingleRoom = 3500000 * singleRoom;
  const totalAmount = priceAdults + priceChildren + priceToddlers + priceSeniors + priceVisa + priceSingleRoom;

  const handleBook = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!isLoggedIn()) {
      antdMessage.warning("Vui lòng đăng nhập để tiến hành đặt tour");
      navigate("/login");
      return;
    }

    if (!fullName.trim()) {
      antdMessage.error("Vui lòng nhập họ tên!");
      return;
    }
    if (!phone.trim()) {
      antdMessage.error("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!/^[0-9]{9,11}$/.test(phone.trim())) {
      antdMessage.error("Số điện thoại không hợp lệ!");
      return;
    }
    if (!email.trim()) {
      antdMessage.error("Vui lòng nhập email!");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      antdMessage.error("Email không hợp lệ!");
      return;
    }

    setSubmitting(true);
    try {
      const dataFinal = {
        info: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          note: note.trim(),
          account_id: user?.id || null,
        },
        cart: [
          {
            tourId: bookingForm.tourId,
            adultsQuantity: adults,
            childrenQuantity: children,
            toddlersQuantity: toddlers,
            infantsQuantity: 0,
            seniorsQuantity: seniors,
            visaQuantity: visa,
            singleRoomQuantity: singleRoom
          }
        ],
        paymentMethod: paymentMethod,
      };

      const response = await createOrder(dataFinal);
      if (response.data.code === "success") {
        antdMessage.success("Đặt tour thành công!");
        onSuccess({
          orderCode: response.data.orderCode,
          checkoutUrl: response.data.checkoutUrl || null,
          paymentMethod
        });
      }
    } catch (error) {
      console.error("Lỗi đặt tour trực tiếp:", error);
      const errorMsg = error.response?.data?.error || "Có lỗi xảy ra khi đặt tour!";
      antdMessage.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN") + "đ";
  };

  // If already successfully booked
  if (bookingForm.success) {
    return (
      <div className="ai-booking-success-card">
        <div className="ai-booking-success-header">
          <span className="ai-booking-success-icon">✓</span>
          <span className="ai-booking-success-title">Đặt tour thành công!</span>
        </div>
        <div className="ai-booking-success-body">
          <p>Mã đơn hàng: <strong className="ai-booking-code">{bookingForm.orderCode}</strong></p>
          <p>
            Phương thức thanh toán: 
            <strong> {bookingForm.paymentMethod === "bank_transfer" ? "Chuyển khoản VietQR" : "Tiền mặt"}</strong>
          </p>
          {bookingForm.paymentMethod === "bank_transfer" && bookingForm.checkoutUrl && (
            bookingForm.paid ? (
              <div className="ai-booking-paid-badge">
                <CheckCircleOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                Đã thanh toán thành công qua VietQR
              </div>
            ) : (
              <a 
                href={bookingForm.checkoutUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ai-booking-btn-pay"
              >
                Thanh toán ngay (PayOS)
              </a>
            )
          )}
          {bookingForm.paymentMethod === "cash" && (
            <div className="ai-booking-cash-note">
              Quý khách vui lòng chuẩn bị tiền mặt thanh toán khi khởi hành. Xin cảm ơn!
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-booking-form-wrapper">
      <div className="ai-booking-form-header">
        ĐĂNG KÝ ĐẶT TOUR
      </div>
      <form onSubmit={handleBook} className="ai-booking-form">
        {/* Info inputs */}
        <div className="ai-booking-form-field">
          <label>Họ và tên *</label>
          <input 
            type="text" 
            placeholder="Nguyễn Văn A" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="ai-booking-form-field">
          <label>Số điện thoại *</label>
          <input 
            type="tel" 
            placeholder="0987654321" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="ai-booking-form-field">
          <label>Email *</label>
          <input 
            type="email" 
            placeholder="example@gmail.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="ai-booking-form-field">
          <label>Ghi chú</label>
          <textarea 
            placeholder="Yêu cầu đặc biệt (nếu có)..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            disabled={submitting}
          />
        </div>

        {/* Counter grid */}
        <div className="ai-booking-counters">
          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Người lớn</span>
              <small>100% giá</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                disabled={adults <= 1 || submitting}
              >-</button>
              <span>{adults}</span>
              <button 
                type="button" 
                onClick={() => setAdults(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>

          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Cao tuổi</span>
              <small>60% giá</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setSeniors(prev => Math.max(0, prev - 1))}
                disabled={seniors <= 0 || submitting}
              >-</button>
              <span>{seniors}</span>
              <button 
                type="button" 
                onClick={() => setSeniors(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>

          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Trẻ em (5-11t)</span>
              <small>70% giá</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                disabled={children <= 0 || submitting}
              >-</button>
              <span>{children}</span>
              <button 
                type="button" 
                onClick={() => setChildren(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>

          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Trẻ nhỏ (2-4t)</span>
              <small>50% giá</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setToddlers(prev => Math.max(0, prev - 1))}
                disabled={toddlers <= 0 || submitting}
              >-</button>
              <span>{toddlers}</span>
              <button 
                type="button" 
                onClick={() => setToddlers(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>

          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Phụ thu Visa</span>
              <small>+1.500.000đ/người</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setVisa(prev => Math.max(0, prev - 1))}
                disabled={visa <= 0 || submitting}
              >-</button>
              <span>{visa}</span>
              <button 
                type="button" 
                onClick={() => setVisa(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>

          <div className="ai-booking-counter-item">
            <div className="ai-booking-counter-label">
              <span>Phòng đơn</span>
              <small>+3.500.000đ/phòng</small>
            </div>
            <div className="ai-booking-counter-controls">
              <button 
                type="button" 
                onClick={() => setSingleRoom(prev => Math.max(0, prev - 1))}
                disabled={singleRoom <= 0 || submitting}
              >-</button>
              <span>{singleRoom}</span>
              <button 
                type="button" 
                onClick={() => setSingleRoom(prev => prev + 1)}
                disabled={submitting}
              >+</button>
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="ai-booking-pricing">
          <div className="ai-booking-pricing-header">Chi tiết giá:</div>
          <div className="ai-booking-pricing-list">
            <div className="ai-booking-price-row">
              <span>Người lớn ({adults})</span>
              <span>{formatPrice(priceAdults)}</span>
            </div>
            {seniors > 0 && (
              <div className="ai-booking-price-row">
                <span>Cao tuổi ({seniors})</span>
                <span>{formatPrice(priceSeniors)}</span>
              </div>
            )}
            {children > 0 && (
              <div className="ai-booking-price-row">
                <span>Trẻ em ({children})</span>
                <span>{formatPrice(priceChildren)}</span>
              </div>
            )}
            {toddlers > 0 && (
              <div className="ai-booking-price-row">
                <span>Trẻ nhỏ ({toddlers})</span>
                <span>{formatPrice(priceToddlers)}</span>
              </div>
            )}
            {visa > 0 && (
              <div className="ai-booking-price-row">
                <span>Visa ({visa})</span>
                <span>{formatPrice(priceVisa)}</span>
              </div>
            )}
            {singleRoom > 0 && (
              <div className="ai-booking-price-row">
                <span>Phòng đơn ({singleRoom})</span>
                <span>{formatPrice(priceSingleRoom)}</span>
              </div>
            )}
          </div>
          <div className="ai-booking-price-total">
            <span>Tổng cộng:</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="ai-booking-payments">
          <div className="ai-booking-payments-header">Phương thức thanh toán:</div>
          <div className="ai-booking-payment-options">
            <label className={`ai-booking-payment-card ${paymentMethod === "bank_transfer" ? "active" : ""}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                disabled={submitting}
              />
              <div className="ai-booking-payment-card-content">
                <span className="payment-title">VietQR (PayOS)</span>
                <span className="payment-desc">Xác nhận tự động</span>
              </div>
            </label>

            <label className={`ai-booking-payment-card ${paymentMethod === "cash" ? "active" : ""}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                disabled={submitting}
              />
              <div className="ai-booking-payment-card-content">
                <span className="payment-title">Tiền mặt</span>
                <span className="payment-desc">Thanh toán sau</span>
              </div>
            </label>
          </div>
        </div>

        {/* Action button */}
        <button 
          type="submit" 
          className="ai-booking-btn-submit"
          disabled={submitting}
        >
          {submitting ? "Đang xử lý..." : paymentMethod === "bank_transfer" ? "Thanh toán VietQR" : "Xác nhận đặt tour"}
        </button>
      </form>
    </div>
  );
};


const AIChat = () => {
  // Get initial user ID
  const [userId, setUserId] = useState(() => {
    const user = getUser();
    return user?.id || "guest";
  });

  // Load initial states from localStorage based on user ID
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("ai_chat_isOpen") === "true";
  });
  const [messages, setMessages] = useState(() => {
    const user = getUser();
    const currentId = user?.id || "guest";
    const saved = localStorage.getItem(`ai_chat_messages_${currentId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved messages:", e);
      }
    }
    return [
      {
        role: "ai",
        content: "Xin chào! 👋 Mình là trợ lý AI tư vấn tour du lịch. Bạn muốn đi đâu, ngân sách bao nhiêu? Mình sẽ giúp bạn tìm tour phù hợp nhé!",
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedTourIds, setAddedTourIds] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Lắng nghe Socket.io real-time cập nhật trạng thái thanh toán thành công
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:3001");
    socket.on("connect", () => {
      console.log("Đã kết nối Socket tại AIChat để nghe thông báo thanh toán");
    });
    
    socket.on("PAYMENT_SUCCESS", (data) => {
      console.log("AIChat nhận PAYMENT_SUCCESS:", data);
      
      setMessages((prev) => {
        let updated = false;
        const newMsgs = prev.map((msg) => {
          if (msg.bookingForm && msg.bookingForm.orderCode === data.orderCode) {
            updated = true;
            return {
              ...msg,
              bookingForm: {
                ...msg.bookingForm,
                paid: true
              }
            };
          }
          return msg;
        });
        if (updated) {
          antdMessage.success(`Thanh toán thành công qua VietQR cho đơn hàng ${data.orderCode}!`);
        }
        return newMsgs;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Poll for user change (login/logout/switch accounts)
  useEffect(() => {
    const interval = setInterval(() => {
      const user = getUser();
      const currentId = user?.id || "guest";
      if (currentId !== userId) {
        setUserId(currentId);
        const saved = localStorage.getItem(`ai_chat_messages_${currentId}`);
        if (saved) {
          try {
            setMessages(JSON.parse(saved));
          } catch (e) {
            setMessages([
              {
                role: "ai",
                content: "Xin chào! 👋 Mình là trợ lý AI tư vấn tour du lịch. Bạn muốn đi đâu, ngân sách bao nhiêu? Mình sẽ giúp bạn tìm tour phù hợp nhé!",
              },
            ]);
          }
        } else {
          setMessages([
            {
              role: "ai",
              content: "Xin chào! 👋 Mình là trợ lý AI tư vấn tour du lịch. Bạn muốn đi đâu, ngân sách bao nhiêu? Mình sẽ giúp bạn tìm tour phù hợp nhé!",
            },
          ]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Save messages to localStorage and auto-scroll
  useEffect(() => {
    localStorage.setItem(`ai_chat_messages_${userId}`, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userId]);

  // Save isOpen to localStorage and focus input
  useEffect(() => {
    localStorage.setItem("ai_chat_isOpen", isOpen);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleClearChat = () => {
    const defaultMsg = [
      {
        role: "ai",
        content: "Xin chào! 👋 Mình là trợ lý AI tư vấn tour du lịch. Bạn muốn đi đâu, ngân sách bao nhiêu? Mình sẽ giúp bạn tìm tour phù hợp nhé!",
      },
    ];
    setMessages(defaultMsg);
  };

  const handleAddToCart = (source) => {
    if (!source.id) {
      antdMessage.error("Không tìm thấy mã tour.");
      return;
    }
    addToCart(source.id, { adultsQuantity: 1 });
    setAddedTourIds((prev) => [...prev, source.id]);
    antdMessage.success(`Đã thêm tour "${source.title}" vào giỏ hàng thành công!`);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: `Tuyệt vời! Mình đã thêm tour "${source.title}" vào danh sách đặt chỗ của bạn rồi. Bạn có thể bấm vào nút "Xem giỏ hàng" màu xanh hoặc chọn menu "Đặt chỗ" ở thanh tiêu đề để hoàn tất thanh toán nhé!`,
      },
    ]);
  };

  const handleInitiateBooking = (source) => {
    if (!source.id) {
      antdMessage.error("Không tìm thấy mã tour.");
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: `Dưới đây là phiếu đăng ký đặt tour **${source.title}** trực tiếp. Bạn vui lòng nhập thông tin hành khách và phương thức thanh toán để hoàn tất đặt tour nhé!`,
        bookingForm: {
          tourId: source.id,
          title: source.title,
          price_special: source.price_special,
          slug: source.slug
        }
      }
    ]);
  };

  const handleOrderSuccess = (msgIndex, orderInfo) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[msgIndex] = {
        ...updated[msgIndex],
        bookingForm: {
          ...updated[msgIndex].bookingForm,
          success: true,
          orderCode: orderInfo.orderCode,
          checkoutUrl: orderInfo.checkoutUrl,
          paymentMethod: orderInfo.paymentMethod,
          paid: false
        }
      };
      return updated;
    });
  };

  const sendQuestion = async (text) => {
    if (!text || loading) return;

    // Thêm tin nhắn user
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    // Tìm tour đang active trong lịch sử chat
    let activeTourSlug = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "ai" && msg.sources && msg.sources.length > 0) {
        activeTourSlug = msg.sources[0].slug;
        break;
      }
    }

    try {
      const response = await sendAiChatMessage(text, activeTourSlug, messages);
      const data = response.data;

      if (data.code === "success") {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.answer,
            sources: data.sources || [],
            bookingForm: data.bookingForm || null,
          },
        ]);
      } else {
        const errMsg = data.error || "Xin lỗi, mình gặp chút trục trặc. Bạn thử hỏi lại nhé!";
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: errMsg,
          },
        ]);
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      const errMsg = error.response?.data?.error || "Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại sau nhé!";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: errMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    sendQuestion(text);
  };

  const handleQuickQuestionClick = (q) => {
    sendQuestion(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0 VNĐ";
    return Number(price).toLocaleString("vi-VN") + " VNĐ";
  };

  const quickQuestions = [
    "Tư vấn tour đi Sapa",
    "Tìm tour đi Đà Nẵng",
    "Có tour Phú Quốc không?",
    "Chính sách hủy tour thế nào?",
  ];

  return (
    <>
      {/* Nút mở chatbot (floating button) */}
      {!isOpen && (
        <button
          className="ai-chat-fab"
          onClick={() => setIsOpen(true)}
          title="Chat với AI tư vấn tour"
          id="ai-chat-open-btn"
        >
          <RobotOutlined style={{ fontSize: 26 }} />
          <span className="ai-chat-fab-badge">AI</span>
        </button>
      )}

      {/* Khung chat */}
      {isOpen && (
        <div className="ai-chat-container">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">
                <RobotOutlined style={{ fontSize: 20, color: "#fff" }} />
              </div>
              <div>
                <div className="ai-chat-header-title">Tư vấn Tour AI</div>
                <div className="ai-chat-header-status">
                  <span className="ai-chat-status-dot"></span>
                  Đang hoạt động
                </div>
              </div>
            </div>
            <div className="ai-chat-header-actions">
              <button
                className="ai-chat-action-btn"
                onClick={handleClearChat}
                title="Xóa lịch sử chat"
                id="ai-chat-clear-btn"
              >
                <DeleteOutlined />
              </button>
              <button
                className="ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                id="ai-chat-close-btn"
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-chat-message ${msg.role === "user" ? "ai-chat-message-user" : "ai-chat-message-ai"}`}
              >
                {msg.role === "ai" && (
                  <div className="ai-chat-msg-avatar">
                    <RobotOutlined style={{ fontSize: 14, color: "#fff" }} />
                  </div>
                )}
                <div className={`ai-chat-bubble ${msg.role === "user" ? "ai-chat-bubble-user" : "ai-chat-bubble-ai"}`}>
                  <div className="ai-chat-bubble-text">{msg.content}</div>

                  {/* Hiển thị Form đặt tour trực tiếp nếu có */}
                  {msg.bookingForm && (
                    <BookingFormWidget
                      bookingForm={msg.bookingForm}
                      onSuccess={(orderInfo) => handleOrderSuccess(index, orderInfo)}
                    />
                  )}

                  {/* Hiển thị sources (tour gợi ý dưới dạng thẻ Card đẹp mắt) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ai-chat-sources">
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="ai-chat-source-card">
                          {source.image && (
                            <img
                              src={source.image}
                              alt={source.title}
                              className="ai-chat-source-card-img"
                            />
                          )}
                          <div className="ai-chat-source-card-body">
                            <h4 className="ai-chat-source-card-title" title={source.title}>
                              {source.title}
                            </h4>
                            <div className="ai-chat-source-card-pricing">
                              {source.discount > 0 && (
                                <span className="ai-chat-source-card-discount">
                                  -{source.discount}%
                                </span>
                              )}
                              <span className="ai-chat-source-card-price-special">
                                {formatPrice(source.price_special)}
                              </span>
                              {source.discount > 0 && (
                                <span className="ai-chat-source-card-price-original">
                                  {formatPrice(source.price)}
                                </span>
                              )}
                            </div>
                            <div className="ai-chat-source-card-actions">
                              <a
                                href={`/tours/detail/${source.slug}`}
                                className="ai-chat-source-card-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Chi tiết
                              </a>
                              {addedTourIds.includes(source.id) ? (
                                <a
                                  href="/cart"
                                  className="ai-chat-source-card-btn-view-cart"
                                >
                                  Giỏ hàng
                                </a>
                              ) : (
                                <button
                                  className="ai-chat-source-card-btn-book"
                                  onClick={() => handleInitiateBooking(source)}
                                >
                                  Đặt tour
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="ai-chat-message ai-chat-message-ai">
                <div className="ai-chat-msg-avatar">
                  <RobotOutlined style={{ fontSize: 14, color: "#fff" }} />
                </div>
                <div className="ai-chat-bubble ai-chat-bubble-ai">
                  <div className="ai-chat-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Gợi ý nhanh (Quick Replies) */}
            {!loading && (
              <div className="ai-chat-quick-replies">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="ai-chat-quick-reply-btn"
                    onClick={() => handleQuickQuestionClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="ai-chat-input-area">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Hỏi về tour du lịch..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              id="ai-chat-input"
            />
            <button
              className={`ai-chat-send-btn ${(!inputValue.trim() || loading) ? "ai-chat-send-btn-disabled" : ""}`}
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              id="ai-chat-send-btn"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
