export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Không tìm thấy đường dẫn - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  console.error("🔥 [Lỗi Server]:", err.message);
  console.error(err.stack); // Log chi tiết lỗi ra terminal để dễ debug

  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ nội bộ";

  res.status(statusCode).json({
    code: "error",
    message: message,
    // Chỉ hiển thị stack trace nếu không phải production
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack
    }),
  });
};