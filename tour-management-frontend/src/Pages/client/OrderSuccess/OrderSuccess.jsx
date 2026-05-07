import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Result, Card, Descriptions, Table, Typography, Space, Button, Spin
} from "antd";
import { HomeOutlined, FileTextOutlined } from "@ant-design/icons";
import { getOrderSuccess } from "../../../services/api";

const { Text, Title } = Typography;

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const [order, setOrder] = useState(null);
  const [ordersItem, setOrdersItem] = useState([]);
  const [loading, setLoading] = useState(true);

  // Logic giữ nguyên
  useEffect(() => {
    const fetchOrderSuccess = async () => {
      try {
        const response = await getOrderSuccess(orderCode);
        setOrder(response.data.order);
        setOrdersItem(response.data.ordersItem);
      } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    if (orderCode) fetchOrderSuccess();
  }, [orderCode]);

  const columns = [
    { title: "STT", key: "index", width: 60, render: (_, __, i) => i + 1 },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 90,
      render: (img) => (
        <img src={img} alt="tour" style={{ width: 70, height: 50, objectFit: "cover", borderRadius: 6 }} />
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
      title: "Số lượng",
      dataIndex: "quantity",
      width: 90,
      align: "center",
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
    <div>
      {/* Success Banner */}
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
          <Button type="primary" key="home" icon={<HomeOutlined />} onClick={() => window.location.href = "/"}>
            Về trang chủ
          </Button>,
        ]}
        style={{ paddingBottom: 16 }}
      />

      {/* Customer info */}
      <Card
        title={<><FileTextOutlined /> Thông tin khách hàng</>}
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
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
        </Descriptions>
      </Card>

      {/* Tour list */}
      <Card
        title="Danh sách tour đã đặt"
        bordered={false}
        style={{ borderRadius: 12 }}
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
