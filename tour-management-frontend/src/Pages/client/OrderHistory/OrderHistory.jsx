import { useEffect, useState } from "react";
import { Table, Tag, Typography, message, Card, Empty, Button, Space, Popconfirm } from "antd";
import {
  CompassOutlined, CalendarOutlined, EyeOutlined,
  BankOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { getClientOrderHistory, cancelClientOrder, getPaymentLink } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import BoxHead from "../../../components/BoxHead";
import "./OrderHistory.css";

const { Text } = Typography;

// Ánh xạ trạng thái DB → hiển thị thân thiện cho khách hàng
const STATUS_MAP = {
  "Khởi tạo": { color: "warning", text: "Đang chờ thanh toán" },
  "Đã thanh toán": { color: "success", text: "Đã xác nhận" },
  "Hoàn thành": { color: "purple", text: "Hoàn thành" },
  "Đã hủy": { color: "error", text: "Đã hủy" },
  // Fallback cho status cũ (tiếng Anh)
  "initial": { color: "warning", text: "Đang chờ thanh toán" },
  "paid": { color: "success", text: "Đã xác nhận" },
  "completed": { color: "purple", text: "Hoàn thành" },
  "cancelled": { color: "error", text: "Đã hủy" },
};


function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getClientOrderHistory();
      if (res.data.code === "success") {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.warning("Vui lòng đăng nhập để xem lịch sử");
        navigate("/login");
      } else {
        message.error("Lỗi khi lấy lịch sử đặt tour");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Hủy đơn hàng đang chờ thanh toán
  const handleCancelOrder = async (id) => {
    try {
      const res = await cancelClientOrder(id);
      if (res.data.code === "success") {
        message.success(res.data.message || "Hủy đặt tour thành công! Chỗ trống đã được hoàn trả.");
        fetchOrders();
      } else {
        message.error(res.data.message || "Lỗi khi hủy đơn hàng");
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    }
  };

  // Mở liên kết thanh toán PayOS
  const handlePayNow = async (order) => {
    setLoading(true);
    try {
      const res = await getPaymentLink(order.id);
      if (res.data.code === "success" && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        message.error("Không thể tạo liên kết thanh toán PayOS");
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || "Lỗi khi kết nối cổng thanh toán PayOS";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      render: (code) => <Text strong style={{ color: "var(--primary)" }}>{code}</Text>,
    },
    {
      title: "Số Tour",
      dataIndex: "totalTours",
      key: "totalTours",
      width: 90,
      align: "center",
      render: (v) => <Tag color="geekblue">{v} tour</Tag>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (price) => (
        <Text strong style={{ color: "#f5222d", fontSize: 15 }}>
          {Number(price || 0).toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "var(--text-muted)" }} />
          <span>{dayjs(date).format("DD/MM/YYYY HH:mm")}</span>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = STATUS_MAP[status] || { color: "default", text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "",
      key: "action",
      width: 220,
      render: (_, record) => (
        <Space>
          {/* Nút "Thanh toán ngay" chỉ hiện khi trạng thái là Khởi tạo hoặc initial */}
          {(record.status === "Khởi tạo" || record.status === "initial") && (
            <Button
              type="primary"
              size="small"
              icon={<BankOutlined />}
              onClick={() => handlePayNow(record)}
              className="btn-pay-now"
            >
              Thanh toán ngay
            </Button>
          )}
          {/* Nút "Hủy đơn" chỉ hiện khi trạng thái là Khởi tạo hoặc initial */}
          {(record.status === "Khởi tạo" || record.status === "initial") && (
            <Popconfirm
              title="Hủy đặt tour"
              description="Bạn có chắc chắn muốn hủy đặt tour này không? Chỗ trống sẽ được giải phóng."
              onConfirm={() => handleCancelOrder(record.id)}
              okText="Đồng ý hủy"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                style={{ borderRadius: 20 }}
              >
                Hủy đơn
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/order/success?orderCode=${record.code}`)}
            style={{ borderRadius: 20 }}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="order-history-page">
      <BoxHead title="Lịch sử đặt tour" subtitle="Theo dõi trạng thái các tour bạn đã đặt" />

      <Card bordered={false} className="order-history-card">
        {orders.length === 0 && !loading ? (
          <Empty
            image={<CompassOutlined className="history-empty-icon" />}
            description="Bạn chưa đặt tour nào"
            style={{ padding: "56px 0" }}
          >
            <Button type="primary" size="large" onClick={() => navigate("/categories")}
              style={{ borderRadius: 24, padding: "0 28px", height: 44, fontWeight: 600 }}
            >
              Khám phá tour ngay
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} đơn hàng` }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
}

export default OrderHistory;
