import { useState, useEffect } from "react";
import { Form, Input, Button, Select, Upload, message, Card, Typography, Space, Spin } from "antd";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminArticleById, updateAdminArticle, getAdminArticleTours } from "../../../services/api";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const { Title } = Typography;
const { TextArea } = Input;

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

function AdminArticleEdit() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, toursRes] = await Promise.all([
          getAdminArticleById(id),
          getAdminArticleTours(),
        ]);

        const article = articleRes.data.article;
        setTours(toursRes.data.tours || []);
        setContent(article.content || "");

        form.setFieldsValue({
          title: article.title,
          summary: article.summary,
          tags: article.tags || [],
          status: article.status,
          tourIds: article.tourIds || [],
        });

        // Hiển thị thumbnail hiện tại
        if (article.thumbnail) {
          setFileList([{
            uid: "-1",
            name: "thumbnail",
            status: "done",
            url: article.thumbnail,
          }]);
        }
      } catch (error) {
        message.error("Lỗi tải dữ liệu bài viết");
        console.error(error);
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [id, form]);

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

      // Chỉ upload nếu user chọn ảnh mới
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("thumbnail", fileList[0].originFileObj);
      }

      const res = await updateAdminArticle(id, formData);
      if (res.data.code === "success") {
        message.success(res.data.message);
        navigate("/admin/articles");
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật bài viết");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/articles")}>
          Quay lại
        </Button>
        <Title level={3} style={{ margin: 0 }}>Sửa bài viết</Title>
      </Space>

      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              maxCount={1}
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
              placeholder="Nhập tag rồi nhấn Enter"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Tour liên quan" name="tourIds">
            <Select
              mode="multiple"
              placeholder="Chọn tours liên quan"
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
              Cập nhật bài viết
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AdminArticleEdit;
