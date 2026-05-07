import { useEffect, useState } from "react";
import {
  Table, Button, Space, Tag, Popconfirm, message, Typography, Card, Avatar, Tooltip
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ReloadOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAdminAccounts, deleteAdminAccount } from "../../../services/api";

const { Title } = Typography;

function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await getAdminAccounts();
      setAccounts(res.data.accounts || []);
    } catch {
      message.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteAdminAccount(id);
      message.success("Xóa tài khoản thành công");
      fetchAccounts();
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "Tài khoản",
      key: "account",
      render: (_, r) => (
        <Space>
          <Avatar
            src={r.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#00b96b" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{r.fullName}</div>
            <div style={{ color: "#8c8c8c", fontSize: 12 }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => role
        ? <Tag color="blue">{role.title}</Tag>
        : <Tag color="default">Chưa gán</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "active" ? "success" : "error"}>
          {s === "active" ? "Hoạt động" : "Bị khóa"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, r) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="primary" size="small" ghost icon={<EditOutlined />}
              onClick={() => navigate(`/admin/accounts/edit/${r.id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa tài khoản này?"
              onConfirm={() => handleDelete(r.id)}
              okText="Xóa" cancelText="Hủy"
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý tài khoản</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>Làm mới</Button>
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => navigate("/admin/accounts/create")}
          >
            Thêm tài khoản
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} tài khoản` }}
        />
      </Card>
    </div>
  );
}

export default AdminAccounts;
