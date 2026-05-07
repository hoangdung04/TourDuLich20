import { useEffect, useState } from "react";
import {
  Table, Button, Space, Tag, Popconfirm, message, Typography, Card, Tooltip, Badge
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, ReloadOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAdminRoles, deleteAdminRole } from "../../../services/api";

const { Title } = Typography;

function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await getAdminRoles();
      setRoles(res.data.roles || []);
    } catch {
      message.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteAdminRole(id);
      message.success("Xóa vai trò thành công");
      fetchRoles();
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "Tên vai trò",
      dataIndex: "title",
      key: "title",
      render: (t) => <span style={{ fontWeight: 600 }}>{t}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (d) => d || <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    {
      title: "Số quyền",
      dataIndex: "permissions",
      key: "permissions",
      render: (p) => (
        <Badge count={p?.length || 0} color="#00b96b" showZero>
          <Tag icon={<SafetyCertificateOutlined />} color="green">
            Quyền hạn
          </Tag>
        </Badge>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "active" ? "success" : "error"}>
          {s === "active" ? "Hoạt động" : "Tắt"}
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
              onClick={() => navigate(`/admin/roles/edit/${r.id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa vai trò này?"
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
        <Title level={3} style={{ margin: 0 }}>Quản lý vai trò</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>Làm mới</Button>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => navigate("/admin/roles/permissions")}
          >
            Phân quyền
          </Button>
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => navigate("/admin/roles/create")}
          >
            Thêm vai trò
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} vai trò` }}
        />
      </Card>
    </div>
  );
}

export default AdminRoles;
