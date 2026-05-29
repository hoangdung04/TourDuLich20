import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table, Select, Tag, Typography, message, Card,
  Button, Space, Tooltip, Popconfirm,
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { getAdminOrders, updateAdminOrderStatus, deleteAdminOrder } from "../../../services/api";
import dayjs from "dayjs";

const { Title } = Typography;

const STATUS_CONFIG = {
  initial:   { color: "blue",   label: "Khởi tạo" },
  paid:      { color: "green",  label: "Đã thanh toán" },
  completed: { color: "purple", label: "Hoàn thành" },
  cancelled: { color: "red",    label: "Đã hủy" },
};

function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders();
      setOrders(res.data.orders || []);
    } catch {
      message.error("Lỗi khi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      message.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch {
      message.error("Cập nhật thất bại");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminOrder(id);
      if (res.data.code === "success") {
        message.success("Xóa đơn hàng thành công!");
        fetchOrders();
      } else {
        message.error(res.data.message || "Xóa thất bại");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ!");
    }
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      render: (code) => <b style={{ color: "#00b96b" }}>{code}</b>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          <div><b>{record.fullName}</b></div>
          <div style={{ fontSize: 12, color: "#888" }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: "Số Tour",
      dataIndex: "totalTours",
      key: "totalTours",
      width: 90,
      align: "center",
      render: (v) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (price) => (
        <span style={{ color: "#f5222d", fontWeight: "bold" }}>
          {Number(price || 0).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 155 }}
          onChange={(val) => handleStatusChange(record.id, val)}
          options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
            value,
            label: <Tag color={cfg.color}>{cfg.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chi tiết đơn hàng">
            <Link to={`/admin/orders/${record.id}`}>
              <Button type="default" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Xóa đơn hàng">
            <Popconfirm
              title="Bạn có chắc muốn xóa đơn hàng này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 20 }}>Quản lý Đơn đặt Tour</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} đơn hàng` }}
        />
      </Card>
    </div>
  );
}

export default AdminOrders;
