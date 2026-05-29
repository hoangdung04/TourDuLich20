import crypto from "crypto";

// Generate Mã đơn hàng
export const generateOrderCode = (number) => {
  const code = `OD${String(number).padStart(8, '0')}`;

  // ${String(n)}: Chuyển đổi giá trị của biến n thành một chuỗi.
  // .padStart(8, '0'): Phương thức padStart được sử dụng để thêm ký tự '0' vào đầu chuỗi sao cho chuỗi có chiều dài là 8. Trong trường hợp này, nếu chuỗi ký tự số có chiều dài ít hơn 8, thì các ký tự '0' sẽ được thêm vào đầu chuỗi để đảm bảo chuỗi có độ dài là 8.
  // Ví dụ:
    // Nếu number = 1, kết quả sẽ là 'OD00000001'.
    // Nếu number = 20, kết quả sẽ là 'OD00000020'.
    // Nếu number = 234, kết quả sẽ là 'OD00000234'.

  return code;
};

// Generate Mã tour
export const generateTourCode = (number) => {
  const code = `TOUR${String(number).padStart(6, '0')}`;
  return code;
};

// Generate token ngẫu nhiên (dùng cho xác thực tài khoản admin)
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Hash password bằng scrypt (Built-in Node.js cực kỳ an toàn, không cần thư viện ngoài)
export const hashPassword = (password) => {
  // Tạo muối ngẫu nhiên (salt) dài 16 bytes
  const salt = crypto.randomBytes(16).toString("hex");
  // Băm mật khẩu bằng scrypt với salt
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  // Lưu kết quả dưới dạng salt:hash để khi so sánh có thể rút trích lại salt
  return `${salt}:${hash}`;
};

// So sánh password (nhập vào) với hash đã lưu
export const comparePassword = (password, storedPasswordHash) => {
  try {
    const [salt, hash] = storedPasswordHash.split(":");
    if (!salt || !hash) return false;
    const currentHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return currentHash === hash;
  } catch {
    return false;
  }
};

