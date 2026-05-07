// ===================================================
// Admin Tours Page - Ant Design Version
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
import { getAdminTours, deleteAdminTour } from '../../../services/api';
import './AdminTours.css';

const { Title } = Typography;

function AdminTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await getAdminTours();
      setTours(response.data.tours);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tour:', error);
      message.error('Không thể lấy danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API: GET /api/admin/tours
  useEffect(() => {
    fetchTours();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminTour(id);
      if (res.data.code === 'success') {
        message.success('Xóa tour thành công!');
        fetchTours();
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
          alt="tour"
          width={100}
          style={{ borderRadius: '8px', objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Giá',
      key: 'price',
      render: (record) => (
        <span>
          <div style={{ fontWeight: 'bold', color: '#00b96b' }}>
            {record.price_special?.toLocaleString()}đ
          </div>
          <div style={{ textDecoration: 'line-through', fontSize: '12px', color: '#999' }}>
            {record.price?.toLocaleString()}đ
          </div>
        </span>
      ),
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount',
      key: 'discount',
      render: (discount) => <Tag color="volcano">{discount}%</Tag>,
    },
    {
      title: 'Còn lại',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Tag color={stock > 10 ? 'blue' : 'orange'}>{stock}</Tag>
      ),
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
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (record) => (
        <Space size="middle">
          <Tooltip title="Chi tiết">
            <Link to={`/admin/tours/detail/${record.id}`}>
              <Button type="default" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Sửa">
            <Link to={`/admin/tours/edit/${record.id}`}>
              <Button type="primary" ghost icon={<EditOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm 
              title="Bạn có chắc chắn muốn xóa tour này?" 
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
    <div className="admin-tours-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý tour</Title>
        <Link to="/admin/tours/create">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Thêm mới tour
          </Button>
        </Link>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={tours} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default AdminTours;
