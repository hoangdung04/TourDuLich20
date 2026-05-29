// ===================================================
// Gemini AI Service – Gọi Google Gemini API
// ===================================================
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Gửi prompt tới Gemini và nhận câu trả lời
 * @param {string} prompt - Nội dung prompt đầy đủ (đã bao gồm CONTEXT + câu hỏi)
 * @returns {Promise<string>} - Câu trả lời từ Gemini
 */
export const askGemini = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  };

  const maxRetries = 3;
  let delay = 1000; // 1 second initial delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Gemini API Error (Lần thử ${attempt}/${maxRetries}):`, errorData);

        // If it's a transient server error (503 Service Unavailable or 500 Server Error), retry.
        // DO NOT retry on 429 (Rate Limit) as the block usually lasts for a minute; retrying immediately will only waste quota.
        if (response.status === 503 || response.status === 500) {
          if (attempt < maxRetries) {
            console.log(`Đang thử lại cuộc gọi Gemini sau ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }
        }
        const err = new Error(`Gemini API lỗi: ${response.status} ${response.statusText}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!answer) {
        throw new Error("Gemini không trả về nội dung hợp lệ.");
      }

      return answer.trim();
    } catch (error) {
      if (attempt === maxRetries || error.status === 429 || error.status === 400) {
        throw error;
      }
      console.warn(`Lỗi khi gọi Gemini (Lần thử ${attempt}/${maxRetries}):`, error.message);
      console.log(`Đang thử lại cuộc gọi Gemini sau ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};
