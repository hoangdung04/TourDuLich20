import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Input, message, Popconfirm, Typography, Image } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAdminArticles, deleteAdminArticle } from "../../../services/api";
import dayjs from "dayjs";

const { Title } = Typography;

function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchArticles = async (page = 1, searchText = "") => {
    setLoading(true);
    try {
      const res = await getAdminArticles({ page, limit: 10, search: searchText });
      setArticles(res.data.articles || []);
      setPagination({
        current: res.data.currentPage,
        pageSize: 10,
        total: res.data.totalItems,
      });
    } catch (error) {
      message.error("Lỗi khi tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminArticle(id);
      if (res.data.code === "success") {
        message.success(res.data.message);
        fetchArticles(pagination.current, search);
      }
    } catch (error) {
      message.error("Lỗi khi xóa bài viết");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnail",
      width: 80,
      render: (url) => (
        <Image
          src={url || "https://placehold.co/60x40?text=No"}
          width={60}
          height={40}
          style={{ objectFit: "cover", borderRadius: 6 }}
          preview={false}
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      render: (title) => <strong>{title}</strong>,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      width: 200,
      render: (tags) => (tags || []).map((tag, i) => <Tag key={i} color="blue">{tag}</Tag>),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "Hiển thị" : "Ẩn"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 140,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/articles/edit/${record.id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa bài viết?"
            description="Bài viết sẽ bị xóa khỏi danh sách"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý bài viết</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/articles/create")}
        >
          Thêm bài viết
        </Button>
      </div>

      <Input.Search
        placeholder="Tìm kiếm theo tiêu đề..."
        allowClear
        enterButton={<SearchOutlined />}
        style={{ maxWidth: 400, marginBottom: 16 }}
        onSearch={(v) => { setSearch(v); fetchArticles(1, v); }}
      />

      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (t) => `Tổng ${t} bài viết`,
          onChange: (page) => fetchArticles(page, search),
        }}
      />
    </div>
  );
}

export default AdminArticles;
