import { useState, useEffect } from "react";
import { Form, Input, Button, Select, Upload, message, Card, Typography, Space } from "antd";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createAdminArticle, getAdminArticleTours } from "../../../services/api";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const { Title } = Typography;
const { TextArea } = Input;

// Cấu hình toolbar cho Rich Text Editor
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

function AdminArticleCreate() {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await getAdminArticleTours();
        setTours(res.data.tours || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách tour:", error);
      }
    };
    fetchTours();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("summary", values.summary || "");
      formData.append("content", content);
      formData.append("tags", JSON.stringify(values.tags || []));
      formData.append("status", values.status || "active");
      formData.append("tourIds", JSON.stringify(values.tourIds || []));

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("thumbnail", fileList[0].originFileObj);
      }

      const res = await createAdminArticle(formData);
      if (res.data.code === "success") {
        message.success(res.data.message);
        navigate("/admin/articles");
      }
    } catch (error) {
      message.error("Lỗi khi tạo bài viết");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/articles")}>
          Quay lại
        </Button>
        <Title level={3} style={{ margin: 0 }}>Thêm bài viết mới</Title>
      </Space>

      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: "active" }}
          style={{ maxWidth: 900 }}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input size="large" placeholder="Nhập tiêu đề bài viết" />
          </Form.Item>

          <Form.Item label="Tóm tắt" name="summary">
            <TextArea rows={3} placeholder="Mô tả ngắn gọn nội dung bài viết..." />
          </Form.Item>

          <Form.Item label="Ảnh đại diện (Thumbnail)">
            <Upload
              listType="picture-card"
              maxCount={3}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Nhập tag rồi nhấn Enter (VD: du-lich, cam-nang)"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Tour liên quan" name="tourIds">
            <Select
              mode="multiple"
              placeholder="Chọn tours liên quan đến bài viết"
              size="large"
              options={tours.map((t) => ({ value: t.id, label: t.title }))}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label="Nội dung bài viết (Rich Text Editor)">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              placeholder="Viết nội dung bài viết tại đây..."
              style={{ minHeight: 300 }}
            />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status">
            <Select size="large">
              <Select.Option value="active">Hiển thị</Select.Option>
              <Select.Option value="inactive">Ẩn</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Lưu bài viết
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AdminArticleCreate;
