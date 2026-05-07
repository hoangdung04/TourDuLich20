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

// Hash password bằng MD5 (giống Project1NodeJs để đồng nhất)
export const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

// So sánh password (nhập vào) với hash đã lưu
export const comparePassword = (password, hash) => {
  return crypto.createHash("md5").update(password).digest("hex") === hash;
};
