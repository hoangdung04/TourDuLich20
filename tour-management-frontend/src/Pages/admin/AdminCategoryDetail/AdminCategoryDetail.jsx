import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, message, Descriptions, Image, Tag, Button, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { getAdminCategoryById } from '../../../services/api';

const { Title } = Typography;

function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await getAdminCategoryById(id);
        setData(response.data.category);
      } catch (error) {
        message.error('Không tìm thấy danh mục!');
        navigate('/admin/categories');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (!data) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/categories')} />
            <Title level={2} style={{ margin: 0 }}>Chi tiết danh mục</Title>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/admin/categories/edit/${data.id}`)}>
            Chỉnh sửa
          </Button>
        </div>

        <Card>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
            <Descriptions.Item label="Tên danh mục">{data.title}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">{data.description || 'Chưa có thông tin'}</Descriptions.Item>
            <Descriptions.Item label="Hình ảnh">
              {data.image ? (
                <Image src={data.image} width={200} style={{ borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                'Chưa có hình ảnh'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí">{data.position}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={data.status === 'active' ? 'green' : 'red'}>
                {data.status === 'active' ? 'Hoạt động' : 'Dừng hoạt động'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Slug">{data.slug}</Descriptions.Item>
            <Descriptions.Item label="Đã xoá">
              {data.deleted ? <Tag color="red">Đã xoá</Tag> : <Tag color="blue">Chưa xoá</Tag>}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
}

export default AdminCategoryDetail;
