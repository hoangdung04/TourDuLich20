// ===================================================
// AI Chat Controller – Xử lý chatbot AI tư vấn tour
// ===================================================
import { askGemini } from "../../services/gemini.service.js";
import {
  analyzeQuestion,
  searchTours,
  searchArticles,
  buildContext,
  buildPrompt,
} from "../../services/tour-rag.service.js";

// [POST] /api/ai-chat — Chatbot AI tư vấn tour
export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        code: "error",
        error: "Vui lòng nhập câu hỏi.",
      });
    }

    const userQuestion = message.trim();

    // 1. Phân tích câu hỏi: tách keyword + điều kiện giá
    const analysis = analyzeQuestion(userQuestion);
    console.log("📝 AI Chat – Phân tích câu hỏi:", {
      question: userQuestion,
      keywords: analysis.keywords,
      priceMin: analysis.priceMin,
      priceMax: analysis.priceMax,
    });

    // 2. Truy vấn tour từ MySQL
    const tours = await searchTours(analysis);
    console.log(`🔍 Tìm thấy ${tours.length} tour phù hợp.`);

    // 3. Tìm bài viết liên quan (nếu có keyword)
    const articles = await searchArticles(analysis.keywords);

    // 4. Tạo CONTEXT từ kết quả query
    const context = buildContext(tours, articles);

    // 5. Tạo prompt hoàn chỉnh
    const prompt = buildPrompt(context, userQuestion);

    // 6. Gửi prompt tới Gemini và nhận câu trả lời
    const answer = await askGemini(prompt);

    // 7. Chuẩn bị sources (danh sách tour đã tìm được)
    const sources = tours.map((tour) => ({
      title: tour.title,
      slug: tour.slug,
      price_special: parseInt(tour.price_special),
    }));

    // 8. Trả kết quả về frontend
    res.json({
      code: "success",
      answer,
      sources,
    });
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
