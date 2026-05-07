import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, message, Descriptions, Image, Tag, Button, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { getAdminTourById } from '../../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

function AdminTourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await getAdminTourById(id);
        setData(response.data.tour);
      } catch (error) {
        message.error('Không tìm thấy tour!');
        navigate('/admin/tours');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (!data) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/tours')} />
            <Title level={2} style={{ margin: 0 }}>Chi tiết Tour</Title>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/admin/tours/edit/${data.id}`)}>
            Chỉnh sửa
          </Button>
        </div>

        <Card>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID" span={2}>{data.id}</Descriptions.Item>
            <Descriptions.Item label="Tên tour" span={2}><b>{data.title}</b></Descriptions.Item>
            
            <Descriptions.Item label="Giá trị mặc định">{data.price?.toLocaleString()} đ</Descriptions.Item>
            <Descriptions.Item label="Giảm giá"><Tag color="volcano">{data.discount}%</Tag></Descriptions.Item>
            <Descriptions.Item label="Số lượng tồn">{data.stock}</Descriptions.Item>
            <Descriptions.Item label="Thời gian bắt đầu">
              {data.timeStart ? dayjs(data.timeStart).format('DD/MM/YYYY HH:mm') : 'Chưa có'}
            </Descriptions.Item>

            <Descriptions.Item label="Vị trí">{data.position}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={data.status === 'active' ? 'green' : 'red'}>
                {data.status === 'active' ? 'Hoạt động' : 'Dừng hoạt động'}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Hình ảnh" span={2}>
              <Space wrap>
                {data.images && data.images.map((img, idx) => (
                   <Image key={idx} src={img} width={150} style={{ borderRadius: 8, objectFit: 'cover' }} />
                ))}
                {(!data.images || data.images.length === 0) && 'Chưa có hình ảnh'}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thông tin hiển thị" span={2}>
              <div dangerouslySetInnerHTML={{ __html: data.information || 'Chưa có thông tin' }}></div>
            </Descriptions.Item>
            
            <Descriptions.Item label="Lịch trình" span={2}>
              <div dangerouslySetInnerHTML={{ __html: data.schedule || 'Chưa có lịch trình' }}></div>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
}

export default AdminTourDetail;
