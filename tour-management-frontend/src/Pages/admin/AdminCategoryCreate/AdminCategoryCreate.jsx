// ===================================================
// Admin Category Create Page
// ===================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Select, InputNumber,
  Upload, Card, Typography, Space, message
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { createAdminCategory } from '../../../services/api';

const { Title } = Typography;
const { TextArea } = Input;

function AdminCategoryCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);

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
    data.append('status', values.status || 'active');
    if (values.position) data.append('position', values.position);
    if (fileList[0]) data.append('image', fileList[0].originFileObj || fileList[0]);

    try {
      const response = await createAdminCategory(data);
      if (response.data.code === 'success') {
        message.success('Tạo danh mục thành công!');
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/categories')} />
          <Title level={2} style={{ margin: 0 }}>Thêm mới danh mục</Title>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ status: 'active' }}
          >
            <Form.Item
              label="Tên danh mục"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
            >
              <Input placeholder="Nhập tên danh mục" size="large" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <TextArea rows={4} placeholder="Nhập mô tả danh mục" />
            </Form.Item>

            <Form.Item label="Hình ảnh">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select size="large">
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Dừng hoạt động</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Vị trí" name="position">
              <InputNumber min={1} placeholder="Tự động tăng" style={{ width: '100%' }} size="large" />
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
                Tạo mới danh mục
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}

export default AdminCategoryCreate;
