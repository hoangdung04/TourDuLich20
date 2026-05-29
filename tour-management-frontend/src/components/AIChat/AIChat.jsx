import React, { useState, useRef, useEffect } from "react";
import { sendAiChatMessage } from "../../services/api";
import { getUser } from "../../utils/auth";
import { RobotOutlined, CloseOutlined, SendOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import "./AIChat.css";

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    // Thêm tin nhắn user
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await sendAiChatMessage(text);
      const data = response.data;

      if (data.code === "success") {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.answer,
            sources: data.sources || [],
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN") + " VNĐ";
  };

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

                  {/* Hiển thị sources (tour gợi ý) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ai-chat-sources">
                      {msg.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={`/tours/detail/${source.slug}`}
                          className="ai-chat-source-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkOutlined />
                          <span className="ai-chat-source-title">{source.title}</span>
                          <span className="ai-chat-source-price">{formatPrice(source.price_special)}</span>
                        </a>
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
