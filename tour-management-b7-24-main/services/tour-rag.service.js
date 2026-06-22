// ===================================================
// Tour RAG Service – Truy vấn dữ liệu tour + tạo context cho AI
// ===================================================
import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";
import { askGemini } from "./gemini.service.js";

/**
 * Loại bỏ HTML tags khỏi chuỗi, chỉ giữ text thuần
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, "\n") // Thay thế các thẻ đóng khối bằng dòng mới
    .replace(/<[^>]*>/g, " ")                     // Xóa tất cả HTML tags còn lại
    .replace(/&nbsp;/g, " ")                      // Thay &nbsp;
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")                      // Gom khoảng trắng liên tiếp trên cùng dòng
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
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không dấu
 * @param {string} str
 * @returns {string}
 */
export const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

/**
 * Phân tích câu hỏi bằng biểu thức chính quy (fallback khi AI gặp sự cố)
 * @param {string} question
 * @returns {{ keywords: string[], priceMin: number|null, priceMax: number|null, sortBy: string|null, intent: string }}
 */
export const analyzeQuestionFallback = (question) => {
  const lower = question.toLowerCase();

  // === PHÂN THÀNH INTENT ===
  let intent = "search_tours";

  const bookTourKeywords = [
    "đặt tour", "dat tour", "đặt chỗ", "dat cho", "đăng ký đi", "dang ky di", "muốn đi tour", "muon di tour", "đăng ký tour", "dang ky tour", "đặt vé", "dat ve", "book tour", "mua tour", "đặt luôn", "dat luon"
  ];

  const generalChatKeywords = [
    "xin chào", "xinchao", "hello", "hi ", "chào bạn", "chào buổi sáng", "gút mồ ninh", "alo",
    "bạn là ai", "tên là gì", "chatbot", "giúp gì",
    "đặt tour như thế nào", "hướng dẫn đặt", "thanh toán", "payos", "chuyển khoản",
    "hủy đơn", "hủy đặt", "hủy tour", "hoàn tiền", "trả tiền", "chính sách hoàn",
    "đăng ký", "đăng nhập", "đăng xuất", "đổi mật khẩu", "quên mật khẩu",
    "liên hệ", "hotline", "số điện thoại", "văn phòng", "địa chỉ", "tổng đài", "giờ làm việc",
    "thời tiết hôm nay thế nào", "thời tiết hà nội", "thời tiết sài gòn",
    "visa", "hộ chiếu", "xe đưa đón", "đưa đón tận nơi", "có bao gồm xe"
  ];

  if (bookTourKeywords.some(keyword => lower.includes(keyword))) {
    intent = "book_tour";
  } else if (generalChatKeywords.some(keyword => lower.includes(keyword))) {
    intent = "general_chat";
  }

  const articleKeywords = [
    "cẩm nang", "kinh nghiệm", "bài viết", "tin tức", "kinh nghiem", "cam nang", "đọc", "doc",
    "hướng dẫn chuẩn bị", "hành lý", "chuẩn bị đồ", "phượt", "du lịch bụi"
  ];
  if (articleKeywords.some(keyword => lower.includes(keyword)) && intent !== "book_tour") {
    intent = "search_articles";
  }

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
    "còn", "con", "chỗ", "cho", "trống", "trong", "vé", "ve", "khách", "khach",
    "nhất", "nhat", "nhứt", "nhut", "thấp", "thap", "đắt", "dat", "max", "min", "hơn", "hon", "ngày", "ngay", "đêm", "dem", "ngay/đem", "ngày/đêm",
    // Từ chỉ đối tượng/nhân khẩu - KHÔNG phải địa danh, loại bỏ để tránh khớp nhầm SQL LIKE
    "trẻ", "tre", "nhỏ", "nho", "già", "người", "nguoi", "tuổi", "tuoi",
    "cao", "bầu", "bau", "sức", "suc", "khỏe", "khoe",
    "phù", "phu", "hợp", "hop", "phụ", "nữ", "nu", "mang", "thai",
    // Từ chung dễ khớp nhầm với tên tour (ví dụ: "nước" khớp "sông nước")
    "nước", "nuoc", "ngoài", "ngoai", "quốc", "quoc", "tế", "te",
    "trong", "nội", "noi", "địa", "dia",
    // Từ chỉ chính sách/dịch vụ - không phải từ khóa tìm kiếm tour
    "visa", "hộ", "ho", "chiếu", "chieu", "cần", "can", "bao",
    "gồm", "gom", "đưa", "dua", "đón", "don",
  ];

  // Danh sách các địa danh ghép nổi tiếng tiếng Việt (được sắp xếp theo độ dài giảm dần)
  const knownDestinations = [
    "vạn lý trường thành", "van ly truong thanh",
    "mù cang chải", "mu cang chai",
    "bà nà hills", "ba na hills",
    "vịnh hạ long", "vinh ha long",
    "buôn ma thuột", "buon ma thuot",
    "ninh vân bay", "ninh van bay",
    "quảng bình", "quang binh",
    "tây nguyên", "tay nguyen",
    "nhật bản", "nhat ban",
    "hàn quốc", "han quoc",
    "quảng ninh", "quang ninh",
    "đà nẵng", "da nang",
    "hội an", "hoi an",
    "phú quốc", "phu quoc",
    "miền tây", "mien tay",
    "sơn đoòng", "son doong",
    "hà giang", "ha giang",
    "châu âu", "chau au",
    "thụy sĩ", "thuy si",
    "bắc kinh", "bac kinh",
    "ninh vân", "ninh van",
    "hạ long", "ha long",
    "vĩnh hy", "vinh hy",
    "cát bà", "cat ba",
    "hà nội", "ha noi",
    "sài gòn", "sai gon",
    "nha trang", "nha trang",
    "mộc châu", "moc chau",
    "fansipan", "fan si pan",
    "đà lạt", "da lat",
    "tràng an", "trang an",
    "bái đính", "bai dinh",
    "tam cốc", "tam coc",
    "phong nha", "phong nha",
    "kẻ bàng", "ke bang"
  ];

  let keywords = [];

  // Loại bỏ các pattern giá khỏi câu hỏi trước khi tách keyword
  let cleanedQuestion = lower
    .replace(/(?:dưới|duoi|under|<)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:trên|tren|over|>)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:khoảng|khoang|tầm|tam|around)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "")
    .replace(/(?:từ|tu)\s*[\d.,]+\s*(?:đến|den|tới|toi|-)\s*[\d.,]+\s*(?:triệu|trieu|tr)/g, "");

  // Trích xuất địa danh ghép trước
  for (const dest of knownDestinations) {
    if (cleanedQuestion.includes(dest)) {
      keywords.push(dest);
      cleanedQuestion = cleanedQuestion.replace(new RegExp(dest, "g"), " ");
    }
  }

  const words = cleanedQuestion
    .replace(/[^a-zA-ZÀ-ỹà-ỹ0-9\s]/g, " ") // Giữ chữ và số
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  // Gom các keyword unique
  keywords = [...new Set([...keywords, ...words])];

  // Mở rộng tìm kiếm cho fallback regex nếu khớp một số cụm từ đặc trưng
  // Nhận diện cụm "nước ngoài" → tour quốc tế
  if (lower.includes("nước ngoài") || lower.includes("nuoc ngoai") || lower.includes("quốc tế") || lower.includes("quoc te")) {
    keywords = keywords.filter(kw => kw !== "nước" && kw !== "nuoc" && kw !== "ngoài" && kw !== "ngoai");
    keywords.push("nhật bản", "hàn quốc", "châu âu", "singapore", "dubai", "bali", "maldives", "trung quốc");
  }
  // Nhận diện cụm "trong nước" → tour nội địa
  if (lower.includes("trong nước") || lower.includes("trong nuoc") || lower.includes("nội địa") || lower.includes("noi dia")) {
    keywords = keywords.filter(kw => kw !== "nước" && kw !== "nuoc" && kw !== "trong");
    keywords.push("sapa", "đà nẵng", "phú quốc", "hà giang", "miền tây", "hội an");
  }
  if (lower.includes("mát") || lower.includes("tránh nóng") || lower.includes("se lạnh")) {
    keywords.push("sapa", "bà nà", "mát mẻ");
  }
  if (lower.includes("biển") || lower.includes("đảo") || lower.includes("nắng")) {
    keywords.push("phú quốc", "maldives", "bali", "ninh vân bay");
  }
  if (lower.includes("tuyết") || lower.includes("mùa đông") || lower.includes("lạnh giá")) {
    keywords.push("hàn quốc", "nhật bản", "châu âu", "tuyết");
  }

  keywords = [...new Set(keywords)];

  let sortBy = null;
  const ascKeywords = ["rẻ", "thấp", "tiết kiệm", "bình dân", "gia re", "tiet kiem", "rẻ nhất", "re nhat", "thấp nhất", "thap nhat"];
  const descKeywords = ["vip", "cao cấp", "sang trọng", "thượng lưu", "đắt", "xa xỉ", "cao nhất", "cao nhat", "đắt nhất", "dat nhat", "max"];
  
  if (ascKeywords.some(kw => lower.includes(kw))) {
    sortBy = "price_asc";
  } else if (descKeywords.some(kw => lower.includes(kw))) {
    sortBy = "price_desc";
  }

  let duration = null;
  const durationMatch = lower.match(/(\d+)\s*(?:ngày|ngay|n)/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
  }

  let limit = 5;
  const isExtreme = ["nhất", "nhat", "nhứt", "nhut", "max", "min"].some(w => lower.includes(w));
  if (isExtreme && (sortBy === "price_asc" || sortBy === "price_desc")) {
    limit = 1;
  }

  return { keywords, priceMin, priceMax, sortBy, duration, intent, limit };
};

/**
 * Phân tích câu hỏi khách hàng sử dụng mô hình ngôn ngữ lớn (Gemini AI)
 * @param {string} question
 * @param {Array} history
 * @returns {Promise<{ keywords: string[], priceMin: number|null, priceMax: number|null, sortBy: string|null, intent: string }>}
 */
export const analyzeQuestion = async (question, history = []) => {
  let contextSnippet = "";
  if (history && history.length > 0) {
    contextSnippet = "Lịch sử trò chuyện gần đây:\n" + 
      history.slice(-4).map(msg => `${msg.role === "user" ? "Khách" : "AI"}: ${msg.content}`).join("\n") + 
      "\n\n";
  }

  const prompt = `Phân tích câu hỏi tiếng Việt của khách hàng về tour du lịch để trích xuất các thông tin tìm kiếm sau. Trả về kết quả dưới định dạng JSON duy nhất, không thêm bất kỳ ký tự hay văn bản giải thích nào khác.

Định dạng JSON cần trả về:
{
  "keywords": ["từ_khóa_1", "từ_khóa_2", ...], // Danh sách các từ khóa tìm kiếm (địa danh, tên tour, hoạt động). Hãy tách từ khóa chi tiết, ví dụ "Đà Nẵng" -> ["Đà Nẵng", "Đà", "Nẵng"] hoặc "Sapa" -> ["Sapa", "Sa", "Pa"] để dễ khớp SQL LIKE. Loại bỏ hoàn toàn các từ dừng chung chung, các từ so sánh/mức độ như "cao", "thấp", "nhất", "rẻ", "đắt", "nhất", "nhat" hoặc từ chỉ đơn vị thời gian như "ngày", "ngay", "đêm", "dem", "ngày/đêm" và các từ nghi vấn hoặc hỏi số lượng/còn trống như "tìm", "tour", "du lịch", "giá", "vé", "bao nhiêu", "có", "mình", "cần", "cho", "hỏi", "còn", "con", "chỗ", "cho", "trống", "không", "khong"...
  "priceMin": null || số_nguyên, // Giá tối thiểu (VNĐ), hoặc null nếu không có
  "priceMax": null || số_nguyên, // Giá tối đa (VNĐ), hoặc null nếu không có
  "sortBy": null || "price_asc" || "price_desc", // "price_asc" nếu khách hàng muốn tìm giá rẻ, giá thấp, tiết kiệm, bình dân, rẻ nhất, thấp nhất; "price_desc" nếu khách hàng yêu cầu cao cấp, sang trọng, xa xỉ, vip, đắt tiền, cao nhất, đắt nhất; hoặc null nếu không yêu cầu.
  "duration": null || số_nguyên, // Số ngày mong muốn của tour (ví dụ: "3 ngày" -> 3, "5 ngày 4 đêm" -> 5, "tour đi 2 ngày" -> 2), hoặc null nếu không có
  "intent": "search_tours" || "search_articles" || "general_chat" || "book_tour" // "search_tours" nếu khách tìm tour, tư vấn tour; "search_articles" nếu khách hỏi về cẩm nang, kinh nghiệm đi lại, đọc bài viết du lịch, kinh nghiệm tự túc, hướng dẫn chuẩn bị đồ/hành lý; "general_chat" nếu khách chào hỏi, hỏi thông tin/chính sách chung của web (như thanh toán, hủy đơn, đăng ký, đăng nhập), hỏi về dịch vụ đi kèm chung của công ty (visa, xe đưa đón tận nơi), hoặc hỏi chuyện phiếm/thời tiết ngoài lề; "book_tour" nếu khách muốn đặt tour, đặt mua, đăng ký đi tour cụ thể (ví dụ: "đặt tour này", "book tour", "muốn mua tour này").
}

Quy tắc phân định ý định (intent):
- "book_tour": Khi khách bày tỏ mong muốn đặt tour, đặt mua, book tour hoặc đăng ký đi tour trực tiếp (ví dụ: "đặt tour này giúp mình", "tôi muốn mua tour", "đăng ký đi tour Sapa", "book tour").
- "search_articles": Khi câu hỏi đề cập đến chia sẻ kinh nghiệm, cẩm nang, hướng dẫn chuẩn bị hành lý, kinh nghiệm đi phượt/tự túc của một vùng/địa điểm (ví dụ: "Kinh nghiệm du lịch tự túc Nha Trang", "Hướng dẫn chuẩn bị hành lý đi leo núi"). Không phải là hỏi về danh sách tour hay giá tour cụ thể để đặt.
- "general_chat": Khi câu hỏi là chào hỏi, hỏi các tính năng tài khoản (đăng ký, đổi mật khẩu), thông tin liên hệ, hotline, địa chỉ văn phòng, các chính sách chung của công ty (chính sách hoàn tiền, chính sách hủy tour), hoặc các câu hỏi thắc mắc chung về dịch vụ của công ty lữ hành như: có bao gồm visa không, có xe đưa đón tận nơi không (ví dụ: "Tour đi Nhật Bản có bao gồm visa không?", "Có hỗ trợ xe đưa đón tận nơi không?", "Thời gian làm việc của tổng đài là khi nào?", "Chính sách hoàn tiền khi hủy tour?").
- "search_tours": Khi câu hỏi tìm kiếm hoặc tư vấn về các tour cụ thể để đi du lịch (ví dụ: "Tìm tour Đà Nẵng dưới 3 triệu", "Tư vấn tour đi Sapa cho gia đình").

Quy tắc phân tích từ khóa và mở rộng tìm kiếm:
- Tách từ khóa địa danh chi tiết thành các từ đơn để tăng khả năng khớp trong SQL (ví dụ: "Sapa" -> ["Sapa", "Sa", "Pa"]).
- Nếu câu hỏi tìm kiếm theo đặc điểm khí hậu, thời tiết hoặc nhu cầu đặc biệt:
  * "mát mẻ", "tránh nóng", "se lạnh" -> tự động thêm các từ khóa: "mát mẻ", "Sapa", "Bà Nà" vào danh sách keywords.
  * "tuyết", "mùa đông", "lạnh giá" -> tự động thêm các từ khóa: "tuyết", "Hàn Quốc", "Nhật Bản", "Châu Âu".
  * "biển", "đảo", "nắng" -> tự động thêm các từ khóa: "Phú Quốc", "Maldives", "Bali", "Ninh Vân Bay".

Quy tắc phân tích giá:
- "dưới 3 triệu" -> priceMax: 3000000, priceMin: null
- "trên 2 triệu" -> priceMin: 2000000, priceMax: null
- "khoảng 5 triệu" / "tầm 5 triệu" -> priceMin: 3500000, priceMax: 6500000
- "từ 2 đến 4 triệu" -> priceMin: 2000000, priceMax: 4000000

Ví dụ 1: "Tìm tour Đà Nẵng dưới 3 triệu"
JSON trả về:
{
  "keywords": ["Đà Nẵng", "Đà", "Nẵng"],
  "priceMin": null,
  "priceMax": 3000000,
  "sortBy": null,
  "intent": "search_tours"
}

Ví dụ 2: "Tư vấn tour đi Sapa giá rẻ cho gia đình"
JSON trả về:
{
  "keywords": ["Sapa", "Sa", "Pa", "gia đình"],
  "priceMin": null,
  "priceMax": null,
  "sortBy": "price_asc",
  "intent": "search_tours"
}

Ví dụ 3: "Thời tiết Hà Nội hôm nay thế nào bạn?"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "general_chat"
}

Ví dụ 4: "Muốn hủy đơn đặt tour thì phải làm sao?"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "general_chat"
}

Ví dụ 5: "Kinh nghiệm du lịch tự túc Nha Trang"
JSON trả về:
{
  "keywords": ["Nha Trang", "Nha", "Trang", "tự túc"],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "search_articles"
}

Ví dụ 6: "Tour đi Nhật Bản có bao gồm visa không?"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "general_chat"
}

Ví dụ 7: "Có hỗ trợ xe đưa đón tận nơi không?"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "general_chat"
}

Ví dụ 8: "Chính sách hoàn tiền khi hủy tour?"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "general_chat"
}

Ví dụ 9: "Hướng dẫn chuẩn bị hành lý đi leo núi"
JSON trả về:
{
  "keywords": ["chuẩn bị hành lý", "hành lý", "leo núi"],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "search_articles"
}

Ví dụ 10: "Mình muốn đặt tour này"
JSON trả về:
{
  "keywords": [],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "book_tour"
}

Ví dụ 11: "Đặt giúp mình tour Sapa 3 ngày 2 đêm"
JSON trả về:
{
  "keywords": ["Sapa", "Sa", "Pa", "3 ngày 2 đêm"],
  "priceMin": null,
  "priceMax": null,
  "sortBy": null,
  "intent": "book_tour"
}

${contextSnippet}Câu hỏi khách hàng cần phân tích: "${question}"
JSON:`;

  try {
    const rawResult = await askGemini(prompt);
    const firstBrace = rawResult.indexOf("{");
    const lastBrace = rawResult.lastIndexOf("}");
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Không tìm thấy cấu trúc JSON trong phản hồi của AI.");
    }
    
    const cleaned = rawResult.substring(firstBrace, lastBrace + 1);
    const result = JSON.parse(cleaned);

    if (!Array.isArray(result.keywords)) {
      result.keywords = [];
    }
    if (!result.intent) {
      result.intent = "search_tours";
    }

    // Hậu xử lý (Post-process) cực trị: nếu hỏi "nhất/max/min" thì giới hạn limit = 1
    const lowerQ = question.toLowerCase();
    const isExtreme = ["nhất", "nhat", "nhứt", "nhut", "max", "min"].some(w => lowerQ.includes(w));
    if (isExtreme && (result.sortBy === "price_asc" || result.sortBy === "price_desc")) {
      result.limit = 1;
    } else {
      result.limit = 5;
    }
    
    console.log("🤖 AI Query Parser thành công:", result);
    return result;
  } catch (error) {
    console.warn("⚠️ AI Query Parser thất bại, chuyển hướng sang fallback regex:", error.message);
    return analyzeQuestionFallback(question);
  }
};

/**
 * Truy vấn tour từ MySQL dựa trên keyword và điều kiện giá
 * @param {{ keywords: string[], priceMin: number|null, priceMax: number|null, sortBy: string|null }} analysis
 * @returns {Promise<Array>} - Danh sách tour phù hợp (tối đa 5)
 */
export const searchTours = async (analysis) => {
  let { keywords, priceMin, priceMax, sortBy, duration, limit } = analysis;

  // Lọc bỏ các từ khóa đơn là substring của từ khóa dài hơn (ví dụ: 'Cat', 'Ba' khi đã có 'Cat Ba')
  // Và lọc bỏ các từ khóa quá ngắn (<= 2 ký tự) để tránh so khớp nhầm các từ ngữ chung dưới SQL
  if (keywords && keywords.length > 0) {
    let filteredSubstrings = [];
    keywords.forEach((kw) => {
      const isSubstring = keywords.some(other => other !== kw && other.toLowerCase().includes(kw.toLowerCase()));
      if (!isSubstring) {
        filteredSubstrings.push(kw);
      }
    });
    // Chuyển toàn bộ từ khóa sang dạng không dấu trước khi filter độ dài
    keywords = filteredSubstrings
      .map(kw => removeAccents(kw))
      .filter(kw => kw.trim().length > 2);
  }

  // Xây dựng điều kiện WHERE
  let whereClauses = [
    "t.deleted = false",
    "t.status = 'active'",
    "t.stock > 0",
  ];
  const replacements = {};

  // Điều kiện keyword: tìm trong title_no_accent, information_no_accent, schedule_no_accent
  if (keywords && keywords.length > 0) {
    const keywordConditions = keywords.map((kw, i) => {
      const paramName = `kw${i}`;
      replacements[paramName] = `%${kw}%`;
      return `(t.title_no_accent LIKE :${paramName} OR t.information_no_accent LIKE :${paramName} OR t.schedule_no_accent LIKE :${paramName})`;
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

  // Sắp xếp: ưu tiên xếp theo số ngày trùng khớp trước (nếu người dùng yêu cầu số ngày cụ thể)
  let orderSQL = "";
  if (duration) {
    const nextDuration = duration + 1;
    const paramDuration = `duration_ngay_${duration}`;
    const paramNextDuration = `duration_ngay_${nextDuration}`;
    replacements[paramDuration] = `%ngay ${duration}%`;
    replacements[paramNextDuration] = `%ngay ${nextDuration}%`;

    const titleDur1 = `%${duration} ngay%`;
    const titleDur2 = `%${duration}n%`;
    replacements[`title_dur1`] = titleDur1;
    replacements[`title_dur2`] = titleDur2;

    // Phạt các tour ghi số ngày khác trong tiêu đề để tránh lệch thông tin với lịch trình
    let penaltySQL = "";
    for (let d = 1; d <= 10; d++) {
      if (d !== duration) {
        const paramBadTitle1 = `bad_title_dur1_${d}`;
        const paramBadTitle2 = `bad_title_dur2_${d}`;
        replacements[paramBadTitle1] = `%${d} ngay%`;
        replacements[paramBadTitle2] = `%${d}n%`;
        penaltySQL += ` - (CASE WHEN t.title_no_accent LIKE :${paramBadTitle1} OR t.title_no_accent LIKE :${paramBadTitle2} THEN 30 ELSE 0 END)`;
      }
    }

    orderSQL += `((CASE WHEN t.schedule_no_accent LIKE :${paramDuration} AND t.schedule_no_accent NOT LIKE :${paramNextDuration} THEN 20 ELSE 0 END + CASE WHEN t.title_no_accent LIKE :title_dur1 OR t.title_no_accent LIKE :title_dur2 THEN 15 ELSE 0 END)${penaltySQL}) DESC, `;
  }

  // Sắp xếp: ưu tiên xếp theo giá trước nếu khách hàng yêu cầu (giá rẻ / cao cấp)
  if (sortBy === "price_asc") {
    orderSQL += "ROUND(t.price * (1 - t.discount / 100)) ASC, ";
  } else if (sortBy === "price_desc") {
    orderSQL += "ROUND(t.price * (1 - t.discount / 100)) DESC, ";
  }

  // Sau đó xếp theo độ liên quan của từ khóa
  if (keywords && keywords.length > 0) {
    const relevanceTerms = keywords.map((kw, i) => {
      return `(CASE WHEN t.title_no_accent LIKE :kw${i} THEN 3 ELSE 0 END + CASE WHEN t.information_no_accent LIKE :kw${i} THEN 1 ELSE 0 END + CASE WHEN t.schedule_no_accent LIKE :kw${i} THEN 1 ELSE 0 END)`;
    });
    orderSQL += `(${relevanceTerms.join(" + ")}) DESC, `;
  }

  orderSQL += "t.discount DESC, t.createdAt DESC";

  const queryLimit = limit === 1 ? 1 : 5;
  const query = `
    SELECT
      t.id, t.title, t.slug, t.price, t.discount, t.stock,
      t.timeStart, t.information, t.schedule, t.images,
      ROUND(t.price * (1 - t.discount / 100)) AS price_special
    FROM tours t
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT ${queryLimit}
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
    return `(a.title LIKE :${paramName} OR a.description LIKE :${paramName} OR a.tags LIKE :${paramName})`;
  });

  const query = `
    SELECT a.title, a.slug, a.description, a.content
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
      const info = truncate(stripHtml(tour.information), 1500);
      if (info) {
        context += `- Thông tin: ${info}\n`;
      }

      // Lịch trình (đã strip HTML, cắt ngắn)
      const schedule = truncate(stripHtml(tour.schedule), 1500);
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
      if (article.description) {
        context += `- Tóm tắt: ${truncate(stripHtml(article.description), 200)}\n`;
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
 * Tạo prompt hoàn chỉnh gửi tới AI
 * @param {string} context
 * @param {string} userQuestion
 * @param {Array} history
 * @returns {string}
 */
export const buildPrompt = (context, userQuestion, history = []) => {
  const currentDateStr = new Date().toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  let historyStr = "";
  if (history && history.length > 0) {
    historyStr = "\n=== LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ ===\n";
    history.forEach((msg) => {
      const roleName = msg.role === "user" ? "Khách hàng" : "Trợ lý AI";
      historyStr += `${roleName}: ${msg.content}\n`;
    });
    historyStr += "===================================\n\n";
  }

  return `Hôm nay là: ${currentDateStr} (giờ Việt Nam). Bạn hãy sử dụng mốc thời gian này để trả lời chính xác các câu hỏi liên quan đến hôm nay, ngày mai, thời tiết hiện tại hoặc các ngày khởi hành sắp tới.

Bạn là chatbot AI tư vấn tour du lịch cho website đặt tour.

CHỈ THỊ CỰC KỲ QUAN TRỌNG VỀ TRÁNH HALLUCINATION (BỊA ĐẶT TOUR):
- Nếu phần CONTEXT có chứa câu "Không tìm thấy tour hoặc bài viết nào phù hợp với câu hỏi." hoặc không có thông tin tour cụ thể nào dưới phần "=== DỮ LIỆU TOUR DU LỊCH ===", bạn TUYỆT ĐỐI KHÔNG ĐƯỢC tự bịa, tự vẽ hoặc tự tạo ra bất kỳ tour du lịch nào (không tự tạo tên tour, giá tiền, ngày khởi hành, số chỗ hay link chi tiết). Bạn PHẢI trả lời rõ ràng và lịch sự là hiện tại hệ thống chưa tìm thấy tour phù hợp hoặc tour đó đã hết chỗ/không tồn tại, và gợi ý khách thử tìm kiếm địa điểm khác hoặc liên hệ hotline để được hỗ trợ trực tiếp.

Vai trò:
Bạn là nhân viên tư vấn tour chuyên nghiệp, hỗ trợ khách chọn tour phù hợp dựa trên dữ liệu hệ thống cung cấp.

Nhiệm vụ:
- Đọc câu hỏi của khách hàng.
- Dựa vào dữ liệu tour/bài viết liên quan trong phần CONTEXT.
- Trả lời bằng tiếng Việt tự nhiên, thân thiện, dễ hiểu.
- Gợi ý tour phù hợp với nhu cầu của khách.
- Chỉ đề xuất duy nhất 1 tour phù hợp nhất với nhu cầu của khách hàng.
- Ưu tiên tour còn chỗ, đang hoạt động, giá phù hợp.
- Nếu khách hỏi về giá, hãy nêu giá sau giảm nếu có dữ liệu price và discount.
- Nếu khách hỏi về lịch trình, chỉ tóm tắt dựa trên schedule trong CONTEXT.
- Nếu khách hỏi chung chung, hãy hỏi lại thêm điểm đến, ngân sách hoặc thời gian mong muốn.

Chính sách hệ thống và Hướng dẫn thao tác (Sử dụng thông tin này nếu khách hàng hỏi về cách thao tác trên web, chính sách hủy, thanh toán, hoặc thông tin liên hệ):
- Đăng ký tài khoản: Click vào biểu tượng tài khoản ở góc trên bên phải màn hình, chọn "Đăng ký" và điền đầy đủ thông tin (Họ tên, email, số điện thoại, mật khẩu).
- Đổi mật khẩu: Khách hàng cần đăng nhập -> truy cập trang cá nhân (/profile) -> chọn mục "Đổi mật khẩu".
- Quên mật khẩu: Tại giao diện Đăng nhập, click "Quên mật khẩu?", nhập email đã đăng ký để nhận mã OTP khôi phục.
- Phương thức thanh toán: Hệ thống hỗ trợ 2 hình thức:
  * Chuyển khoản trực tuyến qua cổng PayOS (quét mã QR ngân hàng tự động, xác thực giao dịch sau 3 giây).
  * Thanh toán sau bằng tiền mặt/offline khi bắt đầu khởi hành tour.
- Hủy đơn đặt tour: Khách hàng truy cập trang "Lịch sử đặt tour" (/order/history). Với các đơn hàng chưa thanh toán hoặc chọn thanh toán sau (ở trạng thái "Chờ thanh toán" hoặc "Khởi tạo"), khách hàng có thể bấm nút "Hủy đơn" trực tiếp trên màn hình để giải phóng chỗ. Đối với các đơn đã thanh toán thành công hoặc cần hỗ trợ khẩn cấp, vui lòng liên hệ Hotline CSKH 1900-6088 hoặc gửi yêu cầu trực tiếp qua ô chat hỗ trợ (Live Chat) ở góc dưới cùng bên phải màn hình để được nhân viên hỗ trợ xử lý hoàn tiền.
- Hotline chăm sóc khách hàng: 1900-6088 (Hỗ trợ từ 8:00 đến 21:00 hàng ngày, kể cả ngày lễ).
- Văn phòng đại diện: Số 12 Khuất Duy Tiến, quận Thanh Xuân, Hà Nội.

Quy tắc:
- Chỉ sử dụng thông tin có trong CONTEXT hoặc thông tin Chính sách hệ thống cung cấp ở trên đối với các thông tin liên quan đến các tour du lịch và thao tác trên website của công ty.
- Không tự bịa thông tin về tour, ngày khởi hành, số chỗ hoặc mức giá không có trong CONTEXT.
- Đối với các câu hỏi chung, câu hỏi xã giao, thông tin thời tiết, tin tức hoặc kiến thức địa danh ngoài lề, bạn có thể sử dụng kết quả tìm kiếm trực tuyến của Google Search để trả lời một cách chính xác nhất cho khách hàng. Trả lời một cách trực tiếp, tự nhiên và chuyên nghiệp; tuyệt đối KHÔNG được đưa ra các câu rào đón hoặc giải thích như "đây không phải chuyên môn chính của mình" hoặc "tôi chỉ là trợ lý tư vấn tour".
- Không nhắc đến từ khóa kỹ thuật như CONTEXT, database, MySQL, RAG, AI, LLM, prompt hay server.
- Nếu khách hàng hỏi về đối tượng phù hợp hoặc lưu ý sức khỏe (ví dụ: người già, trẻ em, phụ nữ mang thai đi được không) của tour trong CONTEXT, hãy trích xuất trực tiếp câu trả lời từ phần 'Đối tượng phù hợp' hoặc 'Lưu ý sức khỏe' trong mô tả của tour đó và trả lời trực tiếp, rõ ràng cho họ. Đừng gợi ý sang tour khác.
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
${historyStr}
CÂU HỎI KHÁCH HÀNG:
${userQuestion}

Hãy trả lời như một nhân viên tư vấn tour đang chat trực tiếp với khách hàng.`;
};

/**
 * Kiểm tra xem câu hỏi có phải là câu hỏi nối tiếp (follow-up) về tour hiện tại hay không
 * @param {string} question
 * @returns {boolean}
 */
export const isFollowUpQuestion = (question) => {
  const lower = question.toLowerCase();
  
  // Nếu chứa các động từ tìm kiếm mới thì chắc chắn là tìm kiếm mới
  const searchVerbs = ["tìm", "tim", "gợi ý", "goi y", "tư vấn", "tu van", "kiếm", "kiem", "muốn đi", "muon di"];
  if (searchVerbs.some(verb => lower.includes(verb))) {
    return false;
  }

  // Các từ khóa chỉ ra họ đang hỏi về đối tượng phù hợp / sức khỏe / lưu ý
  // (ưu tiên kiểm tra TRƯỚC khi kiểm tra địa danh, vì câu hỏi kiểu
  //  "trẻ con đi được tour sapa không" là hỏi về suitability, KHÔNG phải tìm tour mới)
  const suitabilityIndicators = [
    "người già", "người cao tuổi", "trẻ em", "trẻ nhỏ", "trẻ con", "em bé",
    "bà bầu", "phụ nữ mang thai", "mang bầu",
    "đi được không", "được không", "có đi được", "đi được tour",
    "phù hợp không", "an toàn không", "sức khỏe", "lưu ý",
  ];
  
  if (suitabilityIndicators.some(ind => lower.includes(ind))) {
    return true; // Đây là câu hỏi về đối tượng/sức khỏe → luôn là follow-up
  }

  // Danh sách địa danh tiếng Việt phổ biến để nhận diện nếu họ muốn tìm địa danh mới
  const destinations = [
    "sapa", "sa pa", "đà nẵng", "phú quốc", "huế", "hội an", "hà giang", 
    "mù cang chải", "tây nguyên", "buôn ma thuột", "miền tây", "sơn đoòng", 
    "hạ long", "maldives", "bali", "nhật bản", "hàn quốc", "nami", "tokyo", 
    "kyoto", "paris", "thụy sĩ", "venice", "dubai", "singapore", "malaysia"
  ];
  
  const mentionsNewDest = destinations.some(dest => lower.includes(dest));
  if (mentionsNewDest) {
    return false; // Nếu nhắc tới địa danh mới thì là tìm kiếm mới
  }
  
  // Các từ khóa chỉ ra họ đang hỏi tiếp về tour hiện tại
  const followUpIndicators = [
    "này", "đó", "trên",
    "lịch trình", "schedule", "chi tiết", "đặt tour này", "book tour này",
    "giá bao nhiêu", "giá thế nào", "giá của tour", "khởi hành ngày nào", "ngày khởi hành", "ngày đi"
  ];
  
  return followUpIndicators.some(ind => lower.includes(ind));
};

/**
 * Lấy chi tiết 1 tour từ slug
 * @param {string} slug
 * @returns {Promise<Array>}
 */
export const getTourBySlug = async (slug) => {
  const query = `
    SELECT
      t.id, t.title, t.slug, t.price, t.discount, t.stock,
      t.timeStart, t.information, t.schedule, t.images,
      ROUND(t.price * (1 - t.discount / 100)) AS price_special
    FROM tours t
    WHERE t.slug = :slug AND t.deleted = false AND t.status = 'active'
    LIMIT 1
  `;
  const tours = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { slug },
  });
  return tours;
};
