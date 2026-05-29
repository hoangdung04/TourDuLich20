import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Result, Card, Descriptions, Table, Typography, Space, Button, Spin, Tag, message
} from "antd";
import { HomeOutlined, FileTextOutlined, BankOutlined, DollarOutlined, CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { getOrderSuccess } from "../../../services/api";
import { io } from "socket.io-client";
import axios from "axios";
import "./OrderSuccess.css";

const { Text, Title } = Typography;

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  // PayOS redirect có thể tạo nhiều orderCode params, ưu tiên lấy mã bắt đầu bằng "OD"
  const orderCode = (() => {
    const allCodes = searchParams.getAll("orderCode");
    if (allCodes.length > 1) {
      return allCodes.find(c => String(c).startsWith("OD")) || allCodes[0];
    }
    return searchParams.get("orderCode");
  })();
  const [order, setOrder] = useState(null);
  const [ordersItem, setOrdersItem] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy PayOS params từ URL để truyền cho backend
  const payosParams = {
    status: searchParams.get("status"),
    code: searchParams.get("code"),
    cancel: searchParams.get("cancel"),
  };

  const fetchOrderSuccess = async () => {
    try {
      const response = await getOrderSuccess(orderCode, payosParams);
      setOrder(response.data.order);
      setOrdersItem(response.data.ordersItem);
      return response.data.order;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderCode) fetchOrderSuccess();
  }, [orderCode]);

  // Real-time cập nhật trạng thái thanh toán qua Socket.io & Polling
  useEffect(() => {
    if (!orderCode) return;

    // 1. Socket.io
    const socket = io("http://localhost:3001");
    socket.on("connect", () => {
      console.log("Đã kết nối Socket để nghe thông báo thanh toán");
    });
    
    socket.on("PAYMENT_SUCCESS", (data) => {
      if (data.orderCode === orderCode) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
        message.success("Thanh toán thành công! Trạng thái đơn hàng đã được cập nhật.");
      }
    });

    // 2. Polling (Dự phòng mỗi 5 giây nếu đang chờ thanh toán)
    const intervalId = setInterval(async () => {
      setOrder((prev) => {
        if (prev && prev.status === "initial") {
          fetchOrderSuccess();
        }
        return prev;
      });
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(intervalId);
    };
  }, [orderCode]);



  const columns = [
    { title: "STT", key: "index", width: 60, render: (_, __, i) => i + 1 },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 90,
      render: (img) => (
        <img src={img} alt="tour" className="order-tour-img" />
      ),
    },
    {
      title: "Tour",
      dataIndex: "title",
      render: (title, record) => (
        <Link to={`/tours/detail/${record.slug}`}>
          <Text strong>{title}</Text>
        </Link>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price_special",
      render: (v) => <Text style={{ color: "#00b96b" }}>{v?.toLocaleString("vi-VN")}đ</Text>,
    },
    {
      title: "Số lượng & Dịch vụ",
      key: "travelers",
      width: 220,
      render: (_, record) => {
        const details = [];
        if (record.adultsQuantity > 0) details.push(`${record.adultsQuantity} Người lớn`);
        if (record.seniorsQuantity > 0) details.push(`${record.seniorsQuantity} Người cao tuổi`);
        if (record.childrenQuantity > 0) details.push(`${record.childrenQuantity} Trẻ em`);
        if (record.toddlersQuantity > 0) details.push(`${record.toddlersQuantity} Trẻ nhỏ`);
        if (record.visaQuantity > 0) details.push(`Visa: x${record.visaQuantity}`);
        if (record.singleRoomQuantity > 0) details.push(`Phòng đơn: x${record.singleRoomQuantity}`);
        return (
          <div style={{ fontSize: 13, lineHeight: "1.5" }}>
            {details.map((item, idx) => (
              <div key={idx}>{item}</div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "total",
      render: (v) => <Text strong style={{ color: "#ff4d4f" }}>{v?.toLocaleString("vi-VN")}đ</Text>,
    },
  ];

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  if (!order) return <div>Không tìm thấy đơn hàng.</div>;

  return (
    <div className="order-success-page">
      {/* Dynamic Banner based on order status */}
      {(() => {
        const status = order.status;
        if (status === "cancelled" || status === "Đã hủy") {
          return (
            <Result
              status="error"
              title="Đơn hàng đã bị hủy"
              subTitle={
                <>
                  Mã đơn hàng: <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>{order.code}</Text>
                </>
              }
              extra={[
                <Button type="primary" key="home" icon={<HomeOutlined />} className="btn-home" onClick={() => window.location.href = "/"}>
                  Về trang chủ
                </Button>,
              ]}
              style={{ paddingBottom: 16 }}
            />
          );
        }
        if (status === "initial" || status === "Khởi tạo") {
          return (
            <Result
              status="warning"
              title="Đang chờ thanh toán"
              subTitle={
                <>
                  Mã đơn hàng của bạn là: <Text strong copyable style={{ fontSize: 18, color: "#faad14" }}>{order.code}</Text>
                  <br />
                  Vui lòng hoàn tất thanh toán để xác nhận đơn hàng.
                </>
              }
              extra={[
                <Button type="primary" key="home" icon={<HomeOutlined />} className="btn-home" onClick={() => window.location.href = "/"}>
                  Về trang chủ
                </Button>,
              ]}
              style={{ paddingBottom: 16 }}
            />
          );
        }
        // paid, completed, or other statuses → show success
        return (
          <Result
            status="success"
            title="Đặt tour thành công! 🎉"
            subTitle={
              <>
                Mã đơn hàng của bạn là: <Text strong copyable style={{ fontSize: 18, color: "#00b96b" }}>{order.code}</Text>
                <br />
                Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
              </>
            }
            extra={[
              <Button type="primary" key="home" icon={<HomeOutlined />} className="btn-home" onClick={() => window.location.href = "/"}>
                Về trang chủ
              </Button>,
            ]}
            style={{ paddingBottom: 16 }}
          />
        );
      })()}

      {/* Customer info */}
      <Card
        title={<><FileTextOutlined /> Thông tin khách hàng</>}
        bordered={false}
        className="order-info-card"
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Họ và tên">{order.fullName}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{order.phone}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{order.note || "—"}</Descriptions.Item>
          <Descriptions.Item label="Ngày đặt">
            {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            {order.paymentMethod === "bank_transfer" ? (
              <Tag icon={<BankOutlined />} color="blue">Chuyển khoản ngân hàng</Tag>
            ) : (
              <Tag icon={<DollarOutlined />} color="green">Thanh toán tiền mặt</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {(() => {
              const STATUS_MAP = {
                initial: { color: "orange", text: "Đang chờ thanh toán" },
                paid: { color: "green", text: "Đã xác nhận" },
                completed: { color: "purple", text: "Hoàn thành" },
                cancelled: { color: "red", text: "Đã hủy" },
                // Hỗ trợ cho cả dữ liệu cũ nếu còn
                "Khởi tạo": { color: "orange", text: "Đang chờ thanh toán" },
                "Đã thanh toán": { color: "green", text: "Đã xác nhận" },
              };
              const status = order.status;
              const config = STATUS_MAP[status] || { color: "default", text: status };
              return (
                <Space>
                  <Tag color={config.color} icon={status === "initial" ? <SyncOutlined spin /> : (status === "paid" ? <CheckCircleOutlined /> : null)}>
                    {config.text}
                  </Tag>

                </Space>
              );
            })()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tour list */}
      <Card
        title="Danh sách tour đã đặt"
        bordered={false}
        className="order-items-card"
        extra={
          <Space>
            <Text type="secondary">Tổng cộng:</Text>
            <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
              {order.total_price?.toLocaleString("vi-VN")}đ
            </Title>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={ordersItem}
          rowKey="id"
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
}

export default OrderSuccess;
