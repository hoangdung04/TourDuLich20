import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Descriptions, Tag, Table, Image, Typography,
  Button, Space, Select, message, Divider, Statistic, Row, Col, Spin,
} from "antd";
import {
  ArrowLeftOutlined, ShoppingOutlined, UserOutlined,
  PhoneOutlined, FileTextOutlined, DollarOutlined,
} from "@ant-design/icons";
import { getAdminOrderById, updateAdminOrderStatus } from "../../../services/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  initial:   { color: "blue",   label: "Khởi tạo" },
  paid:      { color: "green",  label: "Đã thanh toán" },
  completed: { color: "purple", label: "Hoàn thành" },
  cancelled: { color: "red",    label: "Đã hủy" },
};

function AdminOrderDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [order, setOrder]         = useState(null);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrderById(id);
      setOrder(res.data.order);
      setItems(res.data.ordersItem || []);
    } catch (err) {
      message.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateAdminOrderStatus(id, newStatus);
      message.success("Cập nhật trạng thái thành công");
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch {
      message.error("Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 55,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Ảnh",
      dataIndex: "tourImage",
      key: "tourImage",
      width: 90,
      render: (img) =>
        img ? (
          <Image src={img} width={70} style={{ borderRadius: 8, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 70, height: 50, background: "#f0f0f0", borderRadius: 8 }} />
        ),
    },
    {
      title: "Tour",
      key: "tour",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.tourTitle}</div>
          <Tag color="blue" style={{ marginTop: 4 }}>{record.tourCode}</Tag>
        </div>
      ),
    },
    {
      title: "Khởi hành",
      dataIndex: "timeStart",
      key: "timeStart",
      width: 130,
      render: (d) => d ? dayjs(d).format("DD/MM/YYYY") : "—",
    },
    {
      title: "Giá gốc",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (p) => (
        <span style={{ textDecoration: "line-through", color: "#999" }}>
          {Number(p).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: "Giảm",
      dataIndex: "discount",
      key: "discount",
      width: 70,
      render: (d) => <Tag color="volcano">{d}%</Tag>,
    },
    {
      title: "Giá sau giảm",
      dataIndex: "price_special",
      key: "price_special",
      width: 130,
      render: (p) => (
        <b style={{ color: "#00b96b" }}>{Number(p).toLocaleString()}đ</b>
      ),
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
      key: "total",
      width: 140,
      render: (t) => (
        <b style={{ color: "#f5222d" }}>{Number(t).toLocaleString()}đ</b>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/orders")}>
          Quay lại
        </Button>
        <p style={{ marginTop: 24 }}>Không tìm thấy đơn hàng.</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || { color: "default", label: order.status };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/orders")}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết đơn hàng — <Text style={{ color: "#00b96b" }}>{order.code}</Text>
          </Title>
        </Space>

        <Space align="center">
          <Text strong>Trạng thái:</Text>
          <Select
            value={order.status}
            style={{ width: 165 }}
            loading={updating}
            onChange={handleStatusChange}
            options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
              value,
              label: <Tag color={cfg.color}>{cfg.label}</Tag>,
            }))}
          />
        </Space>
      </div>

      {/* Thống kê nhanh */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng tiền đơn hàng"
              value={Number(order.total_price || 0).toLocaleString()}
              suffix="đ"
              valueStyle={{ color: "#f5222d", fontWeight: "bold" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Số lượng tour"
              value={items.length}
              suffix="tour"
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Trạng thái"
              valueRender={() => (
                <Tag color={statusCfg.color} style={{ fontSize: 14, padding: "4px 12px" }}>
                  {statusCfg.label}
                </Tag>
              )}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Ngày đặt"
              valueRender={() => (
                <Text strong>{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Thông tin khách hàng */}
      <Card
        title={<Space><UserOutlined /> Thông tin khách hàng</Space>}
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={<><UserOutlined /> Họ tên</>}>
            <b>{order.fullName}</b>
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>
            {order.phone}
          </Descriptions.Item>
          <Descriptions.Item label={<><FileTextOutlined /> Ghi chú</>} span={2}>
            {order.note || <Text type="secondary">Không có ghi chú</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Mã đơn hàng">
            <Tag color="green">{order.code}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tài khoản khách">
            {order.account_id
              ? <Tag color="blue">ID: {order.account_id}</Tag>
              : <Tag color="default">Khách vãng lai</Tag>
            }
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Danh sách tour trong đơn */}
      <Card title={<Space><ShoppingOutlined /> Danh sách tour trong đơn</Space>}>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={8} align="right">
                <b>Tổng cộng:</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <b style={{ color: "#f5222d", fontSize: 16 }}>
                  {Number(order.total_price || 0).toLocaleString()}đ
                </b>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
}

export default AdminOrderDetail;
