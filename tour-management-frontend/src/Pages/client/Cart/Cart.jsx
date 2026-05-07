import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Table, Button, Form, Input, InputNumber, Card,
  Space, Typography, Divider, message, Empty
} from "antd";
import {
  DeleteOutlined, ShoppingCartOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { getCartList, createOrder } from "../../../services/api";
import { getCart, removeFromCart, updateCartQuantity, clearCart } from "../../../utils/cart";
import { isLoggedIn, getUser } from "../../../utils/auth";
import BoxHead from "../../../components/BoxHead";
import "./Cart.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [form] = Form.useForm();

  const fetchCartData = async () => {
    try {
      const cart = getCart();
      if (cart.length === 0) {
        setCartItems([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await getCartList(cart);
      setCartItems(response.data.tours);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Lỗi giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCartData(); 
    
    // Nếu đã đăng nhập, tự động điền tên và số điện thoại vào form
    const user = getUser();
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone || ""
      });
    }
  }, [form]);

  // Logic giữ nguyên — xóa item
  const handleDelete = (tourId) => {
    removeFromCart(tourId);
    window.dispatchEvent(new Event("cartUpdated"));
    fetchCartData();
  };

  // Logic giữ nguyên — cập nhật số lượng
  const handleQuantityChange = (tourId, newQuantity) => {
    if (newQuantity > 0) {
      updateCartQuantity(tourId, newQuantity);
      fetchCartData();
    }
  };

  // Đặt tour (yêu cầu đăng nhập)
  const handleOrder = async (values) => {
    if (!isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để tiến hành đặt tour");
      navigate("/login");
      return;
    }

    setOrdering(true);
    try {
      const dataFinal = {
        info: {
          fullName: values.fullName,
          phone: values.phone,
          note: values.note || "",
        },
        cart: getCart(),
      };
      const response = await createOrder(dataFinal);
      if (response.data.code === "success") {
        clearCart();
        window.dispatchEvent(new Event("cartUpdated"));
        message.success("Đặt tour thành công!");
        navigate(`/order/success?orderCode=${response.data.orderCode}`);
      }
    } catch (error) {
      console.error("Lỗi đặt tour:", error);
      message.error("Có lỗi xảy ra khi đặt tour!");
    } finally {
      setOrdering(false);
    }
  };

  // Cột cho Ant Design Table
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 90,
      render: (img) => (
        <img src={img} alt="tour" style={{ width: 70, height: 50, objectFit: "cover", borderRadius: 6 }} />
      ),
    },
    {
      title: "Tour",
      dataIndex: "title",
      render: (title, record) => (
        <Link to={`/tours/detail/${record.slug}`}>
          <Text strong>{title}</Text>
        </Link>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price_special",
      width: 140,
      render: (price) => (
        <Text style={{ color: "#00b96b", fontWeight: 600 }}>
          {price?.toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      render: (qty, record) => (
        <InputNumber
          min={1}
          value={qty}
          onChange={(v) => handleQuantityChange(record.tourId, v)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "total",
      width: 140,
      render: (total) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {total?.toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.tourId)}
        />
      ),
    },
  ];

  return (
    <div>
      <BoxHead title="Giỏ hàng" subtitle="Xem lại và đặt tour của bạn" />

      {/* Cart table */}
      {cartItems.length === 0 && !loading ? (
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: "#ccc" }} />}
          description="Giỏ hàng của bạn đang trống"
        >
          <Button type="primary" onClick={() => navigate("/categories")}>
            Khám phá tour ngay
          </Button>
        </Empty>
      ) : (
        <>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={cartItems}
              rowKey="tourId"
              loading={loading}
              pagination={false}
              scroll={{ x: 700 }}
            />
            <Divider />
            <div style={{ textAlign: "right" }}>
              <Space size={16}>
                <Text type="secondary" style={{ fontSize: 16 }}>Tổng đơn hàng:</Text>
                <Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
                  {total.toLocaleString("vi-VN")}đ
                </Title>
              </Space>
            </div>
          </Card>

          {/* Order form */}
          <Card
            title={<Title level={4} style={{ margin: 0 }}>Thông tin khách hàng</Title>}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOrder}
              style={{ maxWidth: 540 }}
            >
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input size="large" placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ!" },
                ]}
              >
                <Input size="large" placeholder="0901234567" />
              </Form.Item>
              <Form.Item label="Ghi chú" name="note">
                <TextArea rows={3} placeholder="Yêu cầu đặc biệt (nếu có)..." />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                  loading={ordering}
                  style={{ height: 48, fontSize: 16, borderRadius: 10 }}
                  block
                >
                  Xác nhận đặt tour
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      )}
    </div>
  );
}

export default Cart;
