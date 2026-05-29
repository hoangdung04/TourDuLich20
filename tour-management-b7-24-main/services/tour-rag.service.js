// ===================================================
// Tour RAG Service – Truy vấn dữ liệu tour + tạo context cho AI
// ===================================================
import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

/**
 * Loại bỏ HTML tags khỏi chuỗi, chỉ giữ text thuần
 * @param {string} html
 * @returns {string}
 */
const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")   // Xóa tất cả HTML tags
    .replace(/&nbsp;/g, " ")     // Thay &nbsp;
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")        // Gom khoảng trắng liên tiếp
    .trim();
};

/**
 * Cắt ngắn chuỗi nếu quá dài
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
const truncate = (text, maxLength = 500) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Phân tích câu hỏi để tách keyword và điều kiện giá
 * @param {string} question
 * @returns {{ keywords: string[], priceMin: number|null, priceMax: number|null }}
 */
export const analyzeQuestion = (question) => {
  const lower = question.toLowerCase();

  // === PHÂN TÍCH GIÁ ===
  let priceMin = null;
  let priceMax = null;

  // Pattern: "dưới X triệu" / "dưới X tr" / "< X triệu"
  const underMatch = lower.match(/(?:dưới|duoi|under|<)\s*([\d.,]+)\s*(?:triệu|trieu|tr)/);
  if (underMatch) {
    priceMax = parseFloat(underMatch[1].replace(",", ".")) * 1000000;
  }

  // Pattern: "trên X triệu" / "trên X tr" / "> X triệu"
  const overMatch = lower.match(/(?:trên|tren|over|>)\s*([\d.,]+)\s*(?:triệu|trieu|tr)/);
  if (overMatch) {
    priceMin = parseFloat(overMatch[1].replace(",", ".")) * 1000000;
  }

  // Pattern: "khoảng X triệu" / "tầm X triệu" – lấy ±30%
  const aroundMatch = lower.match(/(?:khoảng|khoang|tầm|tam|around)\s*([\d.,]+)\s*(?:triệu|trieu|tr)/);
  if (aroundMatch && !underMatch && !overMatch) {
    const base = parseFloat(aroundMatch[1].replace(",", ".")) * 1000000;
    priceMin = Math.round(base * 0.7);
    priceMax = Math.round(base * 1.3);
  }

  // Pattern: "từ X đến Y triệu"
  const rangeMatch = lower.match(/(?:từ|tu)\s*([\d.,]+)\s*(?:đến|den|tới|toi|-)\s*([\d.,]+)\s*(?:triệu|trieu|tr)/);
  if (rangeMatch) {
    priceMin = parseFloat(rangeMatch[1].replace(",", ".")) * 1000000;
    priceMax = parseFloat(rangeMatch[2].replace(",", ".")) * 1000000;
  }

  // === TÁCH KEYWORD ===
  // Loại bỏ các từ dừng (stopwords) tiếng Việt phổ biến và các pattern giá đã xử lý
  const stopWords = [
    "tôi", "toi", "mình", "minh", "em", "anh", "chị", "chi",
    "muốn", "muon", "cần", "can", "tìm", "tim", "cho", "xin",
    "có", "co", "không", "khong", "được", "duoc", "một", "mot",
    "những", "nhung", "các", "cac", "và", "va", "hay", "hoặc", "hoac",
    "nào", "nao", "gì", "gi", "đi", "di", "về", "ve", "của", "cua",
    "với", "voi", "để", "de", "từ", "tu", "đến", "den", "là", "la",
    "này", "nay", "đó", "do", "thì", "thi", "nên", "nen", "rồi", "roi",
    "ơi", "oi", "nhé", "nhe", "nhỉ", "nhi", "ạ", "a",
    "tour", "du", "lịch", "lich", "giá", "gia", "rẻ", "re",
    "triệu", "trieu", "tr", "nghìn", "nghin", "đồng", "dong", "vnđ", "vnd",
    "dưới", "duoi", "trên", "tren", "khoảng", "khoang", "tầm", "tam",
    "under", "over", "around",
    "hỏi", "hoi", "bạn", "ban", "xem", "thử", "thu",
    "gợi", "goi", "ý", "y", "tư", "tu", "vấn", "van",
    "đặt", "dat", "mua", "book", "booking",
  ];

  // Loại bỏ các pattern giá khỏi câu hỏi trước khi tách keyword
  let cleanedQuestion = lower
    .replace(/(?:dưới|duoi|under|<)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:trên|tren|over|>)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:khoảng|khoang|tầm|tam|around)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:từ|tu)\s*[\d.,]+\s*(?:đến|den|tới|toi|-)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "");

  const words = cleanedQuestion
    .replace(/[^a-zA-ZÀ-ỹà-ỹ0-9\s]/g, " ") // Giữ chữ và số
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  // Gom các keyword unique
  const keywords = [...new Set(words)];

  return { keywords, priceMin, priceMax };
};

/**
 * Truy vấn tour từ MySQL dựa trên keyword và điều kiện giá
 * @param {{ keywords: string[], priceMin: number|null, priceMax: number|null }} analysis
 * @returns {Promise<Array>} - Danh sách tour phù hợp (tối đa 5)
 */
export const searchTours = async (analysis) => {
  const { keywords, priceMin, priceMax } = analysis;

  // Xây dựng điều kiện WHERE
  let whereClauses = [
    "t.deleted = false",
    "t.status = 'active'",
    "t.stock > 0",
  ];
  const replacements = {};

  // Điều kiện keyword: tìm trong title, information, schedule
  if (keywords.length > 0) {
    const keywordConditions = keywords.map((kw, i) => {
      const paramName = `kw${i}`;
      replacements[paramName] = `%${kw}%`;
      return `(t.title LIKE :${paramName} OR t.information LIKE :${paramName} OR t.schedule LIKE :${paramName})`;
    });
    whereClauses.push(`(${keywordConditions.join(" OR ")})`);
  }

  // Điều kiện giá (giá sau giảm)
  if (priceMin !== null) {
    whereClauses.push("ROUND(t.price * (1 - t.discount / 100)) >= :priceMin");
    replacements.priceMin = priceMin;
  }
  if (priceMax !== null) {
    whereClauses.push("ROUND(t.price * (1 - t.discount / 100)) <= :priceMax");
    replacements.priceMax = priceMax;
  }

  const whereSQL = whereClauses.join(" AND ");

  // Sắp xếp: ưu tiên tour khớp nhiều keyword nhất
  let orderSQL = "t.discount DESC, t.createdAt DESC";
  if (keywords.length > 0) {
    const relevanceTerms = keywords.map((kw, i) => {
      return `(CASE WHEN t.title LIKE :kw${i} THEN 3 ELSE 0 END + CASE WHEN t.information LIKE :kw${i} THEN 1 ELSE 0 END + CASE WHEN t.schedule LIKE :kw${i} THEN 1 ELSE 0 END)`;
    });
    orderSQL = `(${relevanceTerms.join(" + ")}) DESC, ${orderSQL}`;
  }

  const query = `
    SELECT
      t.id, t.title, t.slug, t.price, t.discount, t.stock,
      t.timeStart, t.information, t.schedule,
      ROUND(t.price * (1 - t.discount / 100)) AS price_special
    FROM tours t
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT 5
  `;

  const tours = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements,
  });

  return tours;
};

/**
 * Tìm bài viết liên quan (nếu keyword khớp)
 * @param {string[]} keywords
 * @returns {Promise<Array>}
 */
export const searchArticles = async (keywords) => {
  if (!keywords || keywords.length === 0) return [];

  const replacements = {};
  const conditions = keywords.map((kw, i) => {
    const paramName = `akw${i}`;
    replacements[paramName] = `%${kw}%`;
    return `(a.title LIKE :${paramName} OR a.summary LIKE :${paramName} OR a.tags LIKE :${paramName})`;
  });

  const query = `
    SELECT a.title, a.slug, a.summary, a.content
    FROM articles a
    WHERE a.deleted = false AND a.status = 'active'
      AND (${conditions.join(" OR ")})
    LIMIT 2
  `;

  const articles = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements,
  });

  return articles;
};

/**
 * Tạo CONTEXT string từ kết quả truy vấn tour + bài viết
 * @param {Array} tours
 * @param {Array} articles
 * @returns {string}
 */
export const buildContext = (tours, articles) => {
  let context = "";

  if (tours.length > 0) {
    context += "=== DỮ LIỆU TOUR DU LỊCH ===\n\n";
    tours.forEach((tour, i) => {
      const priceFormatted = tour.price_special
        ? Number(tour.price_special).toLocaleString("vi-VN") + " VNĐ"
        : "Liên hệ";
      const originalPrice = tour.price
        ? Number(tour.price).toLocaleString("vi-VN") + " VNĐ"
        : "";
      const timeStart = tour.timeStart
        ? new Date(tour.timeStart).toLocaleDateString("vi-VN")
        : "Chưa xác định";

      context += `Tour ${i + 1}:\n`;
      context += `- Tên: ${tour.title}\n`;
      context += `- Giá gốc: ${originalPrice}\n`;
      context += `- Giảm giá: ${tour.discount || 0}%\n`;
      context += `- Giá sau giảm: ${priceFormatted}\n`;
      context += `- Ngày khởi hành: ${timeStart}\n`;
      context += `- Số chỗ còn: ${tour.stock}\n`;
      context += `- Link chi tiết: /tours/detail/${tour.slug}\n`;

      // Thông tin tour (đã strip HTML, cắt ngắn)
      const info = truncate(stripHtml(tour.information), 300);
      if (info) {
        context += `- Thông tin: ${info}\n`;
      }

      // Lịch trình (đã strip HTML, cắt ngắn)
      const schedule = truncate(stripHtml(tour.schedule), 300);
      if (schedule) {
        context += `- Lịch trình: ${schedule}\n`;
      }

      context += "\n";
    });
  }

  if (articles.length > 0) {
    context += "=== BÀI VIẾT LIÊN QUAN ===\n\n";
    articles.forEach((article, i) => {
      context += `Bài viết ${i + 1}:\n`;
      context += `- Tiêu đề: ${article.title}\n`;
      if (article.summary) {
        context += `- Tóm tắt: ${truncate(stripHtml(article.summary), 200)}\n`;
      }
      if (article.content) {
        context += `- Nội dung: ${truncate(stripHtml(article.content), 300)}\n`;
      }
      context += `- Link: /articles/${article.slug}\n\n`;
    });
  }

  if (!context) {
    context = "Không tìm thấy tour hoặc bài viết nào phù hợp với câu hỏi.";
  }

  // Giới hạn tổng độ dài CONTEXT tối đa 4000 ký tự để tránh prompt quá dài
  if (context.length > 4000) {
    context = context.substring(0, 4000) + "\n\n[... nội dung bị cắt bớt do quá dài]";
  }

  return context;
};

/**
 * Tạo prompt hoàn chỉnh gửi tới Gemini
 * @param {string} context
 * @param {string} userQuestion
 * @returns {string}
 */
export const buildPrompt = (context, userQuestion) => {
  return `Bạn là chatbot AI tư vấn tour du lịch cho website đặt tour.

Vai trò:
Bạn là nhân viên tư vấn tour chuyên nghiệp, hỗ trợ khách chọn tour phù hợp dựa trên dữ liệu hệ thống cung cấp.

Nhiệm vụ:
- Đọc câu hỏi của khách hàng.
- Dựa vào dữ liệu tour/bài viết liên quan trong phần CONTEXT.
- Trả lời bằng tiếng Việt tự nhiên, thân thiện, dễ hiểu.
- Gợi ý tour phù hợp với nhu cầu của khách.
- Nếu có nhiều tour phù hợp, chỉ đề xuất tối đa 3 tour.
- Ưu tiên tour còn chỗ, đang hoạt động, giá phù hợp.
- Nếu khách hỏi về giá, hãy nêu giá sau giảm nếu có dữ liệu price và discount.
- Nếu khách hỏi về lịch trình, chỉ tóm tắt dựa trên schedule trong CONTEXT.
- Nếu khách hỏi chung chung, hãy hỏi lại thêm điểm đến, ngân sách hoặc thời gian mong muốn.

Quy tắc:
- Chỉ sử dụng thông tin có trong CONTEXT.
- Không bịa tour, giá, ngày khởi hành, số chỗ, lịch trình hoặc ưu đãi.
- Không nhắc đến CONTEXT, database, MySQL, RAG, AI, vector hoặc embedding.
- Không hiển thị JSON, id nội bộ hoặc thông tin kỹ thuật.
- Nếu CONTEXT không có tour phù hợp, hãy nói: "Hiện mình chưa tìm thấy tour phù hợp với nhu cầu này." Sau đó hỏi thêm thông tin để tư vấn tiếp.
- Câu trả lời nên ngắn gọn, rõ ràng, phù hợp với dạng tin nhắn chat.

Định dạng trả lời khi có tour phù hợp:
Mở đầu bằng 1 câu xác nhận nhu cầu của khách.

Với mỗi tour, trình bày:
- Tên tour
- Giá sau giảm nếu có
- Ngày khởi hành nếu có
- Số chỗ còn nếu có
- Điểm nổi bật hoặc lịch trình ngắn gọn
- Link chi tiết nếu có slug

Kết thúc bằng một câu hỏi gợi mở để khách tiếp tục lựa chọn.

CONTEXT:
${context}

CÂU HỎI KHÁCH HÀNG:
${userQuestion}

Hãy trả lời như một nhân viên tư vấn tour đang chat trực tiếp với khách hàng.`;
};
