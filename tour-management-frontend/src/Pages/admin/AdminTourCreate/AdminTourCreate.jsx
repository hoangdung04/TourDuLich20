// ===================================================
// Admin Tour Create Page - Ant Design Version
// ===================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  DatePicker,
  Radio,
  Upload,
  Card,
  Typography,
  Space,
  message
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { getAdminTourCategories, createAdminTour } from '../../../services/api';
import './AdminTourCreate.css';

const { Title } = Typography;
const { TextArea } = Input;

function AdminTourCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Lấy danh mục cho select
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAdminTourCategories();
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        message.error('Không thể lấy danh sách danh mục');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Submit form
  const onFinish = async (values) => {
    setSubmitting(true);

    const data = new FormData();
    data.append('title', values.title);
    data.append('category_id', values.category_id);
    data.append('price', values.price || 0);
    data.append('discount', values.discount || 0);
    data.append('stock', values.stock || 0);

    // Antd DatePicker trả về moment/dayjs object, cần format lại
    if (values.timeStart) {
      data.append('timeStart', values.timeStart.format('YYYY-MM-DDTHH:mm'));
    }

    data.append('information', values.information || '');
    data.append('schedule', values.schedule || '');
    data.append('position', values.position || '');
    data.append('status', values.status);

    // Append nhiều ảnh từ fileList
    fileList.forEach((file) => {
      const actualFile = file.originFileObj || file;
      data.append('images', actualFile);
    });

    try {
      const response = await createAdminTour(data);
      if (response.data.code === "success") {
        message.success('Tạo tour thành công!');
        navigate('/admin/tours');
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi khi tạo tour:', error);
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false; // Chặn upload tự động
    },
    fileList,
    multiple: true,
    accept: "image/*"
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div className="admin-tour-create-page">
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/tours')} />
          <Title level={2} style={{ margin: 0 }}>Thêm mới tour</Title>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              status: 'active',
              price: 0,
              discount: 0,
              stock: 0
            }}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề tour!' }]}
            >
              <Input placeholder="Nhập tiêu đề tour" size="large" />
            </Form.Item>

            <Form.Item
              label="Danh mục"
              name="category_id"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            >
              <Select placeholder="-- Chọn danh mục --" size="large">
                {categories.map(item => (
                  <Select.Option key={item.id} value={item.id}>{item.title}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Chọn nhiều ảnh">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />} size="large">Chọn ảnh (JPEG, PNG...)</Button>
              </Upload>
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Form.Item label="Giá (đ)" name="price">
                <InputNumber min={0} style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Form.Item label="% Giảm giá" name="discount">
                <InputNumber min={0} max={100} style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Form.Item label="Số lượng" name="stock">
                <InputNumber min={0} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </div>

            <Form.Item label="Lịch khởi hành" name="timeStart">
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item label="Thông tin tour" name="information">
              <TextArea rows={5} placeholder="Nhập mô tả thông tin tour" />
            </Form.Item>

            <Form.Item label="Lịch trình tour" name="schedule">
              <TextArea rows={5} placeholder="Nhập chi tiết lịch trình" />
            </Form.Item>

            <Form.Item label="Vị trí" name="position">
              <InputNumber min={1} placeholder="Tự động tăng" style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Radio.Group>
                <Radio value="active">Hoạt động</Radio>
                <Radio value="inactive">Dừng hoạt động</Radio>
              </Radio.Group>
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
                Tạo mới tour
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}

export default AdminTourCreate;
