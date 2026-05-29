// ===================================================
// Admin Tours Page - Ant Design Version
// ===================================================
import { useState, useEffect, useCallback } from 'react';
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
  Popconfirm,
  Input,
  Select,
  Row,
  Col,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { getAdminTours, deleteAdminTour, getAdminTourCategories } from '../../../services/api';
import './AdminTours.css';

const { Title } = Typography;
const { Option } = Select;

function AdminTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', category_id: '' });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Lấy danh mục để hiển thị dropdown lọc
  useEffect(() => {
    getAdminTourCategories()
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  const fetchTours = useCallback(async (page = 1, limit = 10, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (currentFilters.search)     params.search      = currentFilters.search;
      if (currentFilters.status)     params.status      = currentFilters.status;
      if (currentFilters.category_id) params.category_id = currentFilters.category_id;

      const response = await getAdminTours(params);
      setTours(response.data.tours);
      setPagination(prev => ({
        ...prev,
        current:  response.data.currentPage,
        pageSize: limit,
        total:    response.data.totalItems,
      }));
    } catch (error) {
      message.error('Không thể lấy danh sách tour');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTours(1, pagination.pageSize, filters);
  }, [filters]);

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminTour(id);
      if (res.data.code === 'success') {
        message.success('Xóa tour thành công!');
        fetchTours(pagination.current, pagination.pageSize);
      } else {
        message.error(res.data.message || 'Xóa thất bại!');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ!');
    }
  };

  const handleReset = () => {
    setFilters({ search: '', status: '', category_id: '' });
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 55,
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 110,
      render: (image) => (
        <Image
          src={image}
          alt="tour"
          width={90}
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
      title: 'Mã tour',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Giá',
      key: 'price',
      width: 140,
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
      title: 'Giảm',
      dataIndex: 'discount',
      key: 'discount',
      width: 70,
      render: (discount) => <Tag color="volcano">{discount}%</Tag>,
    },
    {
      title: 'Còn lại',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock) => (
        <Tag color={stock > 10 ? 'blue' : 'orange'}>{stock}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Dừng'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 140,
      render: (record) => (
        <Space size="small">
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý tour</Title>
        <Link to="/admin/tours/create">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Thêm mới tour
          </Button>
        </Link>
      </div>

      {/* ====== Bộ tìm kiếm / lọc ====== */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Tìm theo tiêu đề tour..."
              prefix={<SearchOutlined />}
              allowClear
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(val) => setFilters(prev => ({ ...prev, status: val || '' }))}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Dừng hoạt động</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Select
              placeholder="Danh mục"
              allowClear
              style={{ width: '100%' }}
              value={filters.category_id || undefined}
              onChange={(val) => setFilters(prev => ({ ...prev, category_id: val || '' }))}
              showSearch
              optionFilterProp="children"
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.title}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={2} md={2}>
            <Tooltip title="Đặt lại bộ lọc">
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* ====== Bảng tour ====== */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={tours} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            current:       pagination.current,
            pageSize:      pagination.pageSize,
            total:         pagination.total,
            onChange:      (page, pageSize) => fetchTours(page, pageSize, filters),
            showSizeChanger: true,
            showTotal:     (total) => `Tổng ${total} tour`,
          }}
        />
      </Card>
    </div>
  );
}

export default AdminTours;


