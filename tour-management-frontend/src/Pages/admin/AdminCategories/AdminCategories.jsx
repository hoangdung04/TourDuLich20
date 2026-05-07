// ===================================================
// Admin Categories Page - Ant Design Version
// ===================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Card, 
  Tag, 
  Space, 
  Typography, 
  Image, 
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { getAdminCategories, deleteAdminCategory } from '../../../services/api';
import './AdminCategories.css';

const { Title } = Typography;

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getAdminCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
      message.error('Không thể lấy danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API: GET /api/admin/categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminCategory(id);
      if (res.data.code === 'success') {
        message.success('Xóa danh mục thành công!');
        fetchCategories();
      } else {
        message.error(res.data.message || 'Xóa thất bại!');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ!');
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 120,
      render: (image) => (
        <Image
          src={image}
          alt="category"
          width={100}
          style={{ borderRadius: '8px', objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Dừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (record) => (
        <Space size="middle">
          <Tooltip title="Chi tiết">
            <Link to={`/admin/categories/detail/${record.id}`}>
              <Button type="default" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Sửa">
            <Link to={`/admin/categories/edit/${record.id}`}>
              <Button type="primary" ghost icon={<EditOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm 
              title="Bạn có chắc chắn muốn xóa danh mục này?" 
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
    <div className="admin-categories-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Danh mục tour</Title>
        <Link to="/admin/categories/create">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Thêm mới danh mục
          </Button>
        </Link>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={categories} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default AdminCategories;
