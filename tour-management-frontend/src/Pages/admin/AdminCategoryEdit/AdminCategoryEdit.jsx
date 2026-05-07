// ===================================================
// Admin Category Edit Page
// ===================================================
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Select, InputNumber,
  Upload, Card, Typography, Space, message, Image, Spin
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { getAdminCategoryById, updateAdminCategory } from '../../../services/api';

const { Title } = Typography;
const { TextArea } = Input;

function AdminCategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [currentImage, setCurrentImage] = useState('');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await getAdminCategoryById(id);
        const cat = response.data.category;
        form.setFieldsValue({
          title: cat.title,
          description: cat.description,
          status: cat.status,
          position: cat.position,
        });
        setCurrentImage(cat.image || '');
      } catch (error) {
        message.error('Không thể lấy thông tin danh mục');
        navigate('/admin/categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id]);

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => { setFileList([file]); return false; },
    fileList,
    maxCount: 1,
    accept: 'image/*'
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    const data = new FormData();
    data.append('title', values.title);
    data.append('description', values.description || '');
    data.append('status', values.status);
    if (values.position) data.append('position', values.position);
    if (fileList[0]) data.append('image', fileList[0].originFileObj || fileList[0]);

    try {
      const response = await updateAdminCategory(id, data);
      if (response.data.code === 'success') {
        message.success('Cập nhật danh mục thành công!');
        navigate('/admin/categories');
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/categories')} />
          <Title level={2} style={{ margin: 0 }}>Chỉnh sửa danh mục</Title>
        </div>

        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Tên danh mục"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
            >
              <Input placeholder="Nhập tên danh mục" size="large" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item label="Hình ảnh hiện tại">
              {currentImage
                ? <Image src={currentImage} width={200} style={{ borderRadius: 8 }} />
                : <span style={{ color: '#999' }}>Chưa có ảnh</span>
              }
            </Form.Item>

            <Form.Item label="Thay ảnh mới (tuỳ chọn)">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
              </Upload>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select size="large">
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Dừng hoạt động</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Vị trí" name="position">
              <InputNumber min={1} style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                block
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}

export default AdminCategoryEdit;
