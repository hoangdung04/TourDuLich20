// ===================================================
// AI Chat Controller – Xử lý chatbot AI tư vấn tour
// ===================================================
import { askGemini } from "../../services/gemini.service.js";
import { askGroq } from "../../services/groq.service.js";
import {
  analyzeQuestion,
  searchTours,
  searchArticles,
  buildContext,
  buildPrompt,
  isFollowUpQuestion,
  getTourBySlug,
  stripHtml,
} from "../../services/tour-rag.service.js";

// [POST] /api/ai-chat — Chatbot AI tư vấn tour
export const chat = async (req, res) => {
  try {
    const { message, activeTourSlug, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        code: "error",
        error: "Vui lòng nhập câu hỏi.",
      });
    }

    const userQuestion = message.trim();

    // 1. Phân tích câu hỏi: tách keyword + điều kiện giá (truyền thêm lịch sử chat để nhận diện ngữ cảnh)
    const analysis = await analyzeQuestion(userQuestion, history);
    console.log("📝 AI Chat – Phân tích câu hỏi:", {
      question: userQuestion,
      keywords: analysis.keywords,
      priceMin: analysis.priceMin,
      priceMax: analysis.priceMax,
      intent: analysis.intent,
    });

    // 2. Truy vấn tour từ MySQL (Ưu tiên nạp tour cũ nếu là câu hỏi tiếp nối)
    let tours = [];
    let isFollowUp = false;
    let articles = [];

    if (analysis.intent !== "general_chat") {
      if (activeTourSlug && isFollowUpQuestion(userQuestion)) {
        console.log(`🔗 Nhận diện câu hỏi tiếp nối cho Tour Slug: ${activeTourSlug}`);
        tours = await getTourBySlug(activeTourSlug);
        isFollowUp = true;
      }

      // Nếu không tìm thấy hoặc không phải câu hỏi tiếp nối, tìm kiếm mới
      if (tours.length === 0) {
        tours = await searchTours(analysis);
        isFollowUp = false;
      }

      // 3. Tìm bài viết liên quan (nếu có keyword)
      articles = await searchArticles(analysis.keywords);
    } else if (analysis.keywords && analysis.keywords.length > 0) {
      // general_chat nhưng có chứa từ khóa địa danh → vẫn truy vấn DB để gợi ý tour kèm theo
      console.log("💬 Câu hỏi chung nhưng có từ khóa địa danh, vẫn tìm tour liên quan:", analysis.keywords);
      tours = await searchTours(analysis);
    } else {
      console.log("💬 Bỏ qua truy vấn tour/bài viết vì đây là câu hỏi xã giao/ngoài lề.");
    }

    // 4. Tạo CONTEXT từ kết quả query
    const context = buildContext(tours, articles);

    // 5. Tạo prompt hoàn chỉnh (kèm lịch sử hội thoại để AI ghi nhớ câu trả lời)
    const prompt = buildPrompt(context, userQuestion, history);

    // 6. Gửi prompt tới AI và nhận câu trả lời (Điều hướng thông minh: general_chat ưu tiên Gemini, tour service ưu tiên Groq/Llama)
    let answer;
    try {
      if (analysis.intent === "general_chat") {
        // Xã giao, thời tiết, chính sách -> Ưu tiên Gemini để tận dụng Google Search Grounding
        if (process.env.GEMINI_API_KEY) {
          try {
            console.log("🤖 Chatbot AI: [General Chat] Ưu tiên sử dụng Gemini (gemini-2.5-flash)...");
            answer = await askGemini(prompt);
          } catch (error) {
            if (process.env.GROQ_API_KEY) {
              console.warn("⚠️ [General Chat] Gemini gặp sự cố, tự động chuyển hướng sang Groq (Llama 3.1):", error.message);
              answer = await askGroq(prompt);
            } else {
              throw error;
            }
          }
        } else if (process.env.GROQ_API_KEY) {
          console.log("🤖 Chatbot AI: [General Chat] GEMINI_API_KEY chưa được cấu hình. Sử dụng Groq (Llama 3.1)...");
          answer = await askGroq(prompt);
        } else {
          throw new Error("Không có API Key cho dịch vụ AI nào được cấu hình");
        }
      } else {
        // Hỏi về Tour, Đặt Tour, Bài viết -> Ưu tiên Groq (Llama 3.1) theo đặc tả báo cáo đồ án
        if (process.env.GROQ_API_KEY) {
          try {
            console.log("🤖 Chatbot AI: [Tour Service] Ưu tiên sử dụng Groq (Llama 3.1)...");
            answer = await askGroq(prompt);
          } catch (error) {
            if (process.env.GEMINI_API_KEY) {
              console.warn("⚠️ [Tour Service] Groq gặp sự cố, tự động chuyển hướng sang Gemini (gemini-2.5-flash):", error.message);
              answer = await askGemini(prompt);
            } else {
              throw error;
            }
          }
        } else if (process.env.GEMINI_API_KEY) {
          console.log("🤖 Chatbot AI: [Tour Service] GROQ_API_KEY chưa được cấu hình. Sử dụng Gemini (gemini-2.5-flash)...");
          answer = await askGemini(prompt);
        } else {
          throw new Error("Không có API Key cho dịch vụ AI nào được cấu hình");
        }
      }
    } catch (aiError) {
      console.warn("⚠️ Cả hai dịch vụ AI đều gặp sự cố hoặc bị Rate Limit. Sử dụng câu trả lời fallback từ Database:", aiError.message);
      
      const isCancellationQuery = ["hủy", "cancel", "hoàn tiền", "trả tiền"].some(w => userQuestion.toLowerCase().includes(w));
      const isPaymentQuery = ["thanh toán", "payos", "chuyển khoản", "banking"].some(w => userQuestion.toLowerCase().includes(w));
      
      if (isCancellationQuery) {
        answer = `Chào bạn! Hiện tại hệ thống tư vấn AI đang bận phản hồi (Rate Limit). Tuy nhiên, về chính sách và hướng dẫn hủy đơn đặt tour:\n\n- Bạn có thể chủ động hủy các đơn đặt tour chưa thanh toán bằng cách truy cập trang **Lịch sử đặt tour** (/order/history) và bấm nút **Hủy đơn**.\n- Đối với các đơn đã thanh toán thành công hoặc cần hỗ trợ khẩn cấp, vui lòng liên hệ Hotline **0869751207** hoặc nhắn tin trực tiếp qua ô chat hỗ trợ (Live Chat) ở góc dưới bên phải màn hình để được nhân viên hỗ trợ thủ tục hoàn tiền nhanh nhất.`;
      } else if (isPaymentQuery) {
        answer = `Chào bạn! Hiện tại hệ thống tư vấn AI đang bận phản hồi (Rate Limit). Tuy nhiên, về phương thức thanh toán trên website:\n\n- Hệ thống hỗ trợ thanh toán chuyển khoản trực tuyến qua cổng **PayOS** (quét mã QR ngân hàng nhanh bằng VietQR, giao dịch xác nhận tự động sau 3 giây).\n- Hoặc bạn có thể chọn thanh toán sau bằng tiền mặt/offline khi bắt đầu khởi hành tour.`;
      } else if (tours && tours.length > 0) {
        const primaryTour = tours[0];
        const infoText = stripHtml(primaryTour.information);
        
        // Trích xuất đoạn chứa đối tượng phù hợp hoặc lưu ý sức khỏe
        const suitabilityMatch = infoText.match(/(Đối tượng phù hợp[^\n]*)/i);
        const suitabilityInfo = suitabilityMatch ? suitabilityMatch[1].trim() : "";
        
        const scheduleText = stripHtml(primaryTour.schedule);
        
        const priceFormatted = primaryTour.price_special
          ? Number(primaryTour.price_special).toLocaleString("vi-VN") + " VNĐ"
          : "Liên hệ";
        
        // Phân loại câu hỏi của người dùng để trả lời fallback đúng ý
        const isHealthOrAgeQuery = ["già", "cao tuổi", "trẻ em", "trẻ nhỏ", "em bé", "tuổi", "sức khỏe", "bà bầu", "mang thai", "phụ nữ"].some(w => userQuestion.toLowerCase().includes(w));
        const isScheduleQuery = ["lịch trình", "schedule", "ngày", "chi tiết", "hành trình"].some(w => userQuestion.toLowerCase().includes(w));
        
        if (activeTourSlug && isFollowUpQuestion(userQuestion) && isHealthOrAgeQuery && suitabilityInfo) {
          answer = `Hiện tại hệ thống AI đang bận phản hồi (Rate Limit). Tuy nhiên, thông tin từ hệ thống về **đối tượng phù hợp và sức khỏe** cho tour **${primaryTour.title}** như sau:\n\n👉 *${suitabilityInfo}*\n\nBạn có thể tham khảo thêm chi tiết ở thẻ gợi ý bên dưới nhé!`;
        } else if (activeTourSlug && isFollowUpQuestion(userQuestion) && isScheduleQuery && scheduleText) {
          answer = `Hiện tại hệ thống AI đang bận phản hồi (Rate Limit). Tuy nhiên, thông tin từ hệ thống về **lịch trình chi tiết** cho tour **${primaryTour.title}** như sau:\n\n${scheduleText}\n\nBạn có thể tham khảo thêm chi tiết ở thẻ gợi ý bên dưới nhé!`;
        } else {
          answer = `Chào bạn! Hiện tại hệ thống tư vấn AI đang bận phản hồi (Rate Limit), nhưng mình đã tìm thấy tour rất phù hợp cho bạn: **${primaryTour.title}** với giá ưu đãi là **${priceFormatted}**.\n\nBạn có thể tham khảo thông tin chi tiết và đặt tour ở thẻ gợi ý ngay bên dưới nhé! Xin lỗi bạn vì sự bất tiện này.`;
        }
      } else {
        answer = "Chào bạn! Hiện tại hệ thống tư vấn AI đang bận phản hồi nhiều yêu cầu cùng lúc (Rate Limit) và chưa tìm thấy tour phù hợp ngay lập tức. Bạn vui lòng thử lại sau 15-30 giây nhé! Cảm ơn bạn.";
      }
    }

    // 7. Chuẩn bị sources (danh sách tour đã tìm được)
    const sources = tours.map((tour) => {
      let imageList = [];
      try {
        if (tour.images) {
          if (typeof tour.images === "string") {
            if (tour.images.startsWith("[")) {
              imageList = JSON.parse(tour.images);
            } else {
              imageList = tour.images.split(",").map(img => img.trim());
            }
          } else if (Array.isArray(tour.images)) {
            imageList = tour.images;
          }
        }
      } catch (e) {
        console.warn("Lỗi parse ảnh tour:", e.message);
        imageList = [];
      }

      return {
        id: tour.id,
        title: tour.title,
        slug: tour.slug,
        price: tour.price ? parseInt(tour.price) : 0,
        discount: tour.discount ? parseInt(tour.discount) : 0,
        price_special: tour.price_special ? parseInt(tour.price_special) : 0,
        image: imageList[0] || "",
      };
    });

    // 8. Trả kết quả về frontend (kèm theo form đăng ký đặt tour nếu khách hàng muốn đặt)
    const responseData = {
      code: "success",
      answer,
      sources,
    };

    if (analysis.intent === "book_tour" && tours && tours.length > 0) {
      const primaryTour = tours[0];
      responseData.bookingForm = {
        tourId: primaryTour.id,
        title: primaryTour.title,
        price_special: primaryTour.price_special ? parseInt(primaryTour.price_special) : 0,
        slug: primaryTour.slug
      };
      
      // Ghi đè câu trả lời của AI để hướng dẫn khách điền phiếu đặt tour ngay trong khung chat
      responseData.answer = `Dưới đây là phiếu đăng ký đặt tour **${primaryTour.title}** trực tiếp. Bạn vui lòng nhập thông tin hành khách và phương thức thanh toán để hoàn tất đặt tour nhé!`;
    }

    res.json(responseData);
  } catch (error) {
    console.error("❌ AI Chat Error:", error.message);

    if (error.message.includes("429")) {
      return res.status(429).json({
        code: "rate_limit",
        error: "Hiện tại hệ thống AI đang nhận nhiều yêu cầu cùng lúc (Rate Limit). Bạn vui lòng đợi khoảng 15-30 giây và thử lại nhé! ⏳",
      });
    }

    res.status(500).json({
      code: "error",
      error: "Xin lỗi, chatbot đang gặp sự cố. Vui lòng thử lại sau.",
    });
  }
};
