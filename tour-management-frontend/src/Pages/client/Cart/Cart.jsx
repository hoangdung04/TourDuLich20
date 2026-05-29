import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Table, Button, Form, Input, InputNumber, Card,
  Space, Typography, Divider, message, Empty, Radio, Tag
} from "antd";
import {
  DeleteOutlined, ShoppingCartOutlined, CheckCircleOutlined,
  BankOutlined, DollarOutlined,
} from "@ant-design/icons";
import { getCartList, createOrder } from "../../../services/api";
import { getCart, removeFromCart, updateCartItemDetails, clearCart } from "../../../utils/cart";
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
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

  // Gửi đơn hàng lên server
  const submitOrder = async (values, method) => {
    setOrdering(true);
    try {
      const dataFinal = {
        info: {
          fullName: values.fullName,
          phone: values.phone,
          note: values.note || "",
          account_id: getUser()?.id || null,
        },
        cart: getCart(),
        paymentMethod: method,
      };
      const response = await createOrder(dataFinal);
      if (response.data.code === "success") {
        clearCart();
        window.dispatchEvent(new Event("cartUpdated"));
        message.success("Đặt tour thành công!");
        
        if (response.data.checkoutUrl) {
          // PayOS: Chuyển hướng tới cổng thanh toán
          window.location.href = response.data.checkoutUrl;
        } else {
          navigate(`/order/success?orderCode=${response.data.orderCode}`);
        }
      }
    } catch (error) {
      console.error("Lỗi đặt tour:", error);
      const errorMsg = error.response?.data?.error || "Có lỗi xảy ra khi đặt tour!";
      message.error(errorMsg);
    } finally {
      setOrdering(false);
    }
  };

  // Đặt tour (yêu cầu đăng nhập)
  const handleOrder = async (values) => {
    if (!isLoggedIn()) {
      message.warning("Vui lòng đăng nhập để tiến hành đặt tour");
      navigate("/login");
      return;
    }

    await submitOrder(values, paymentMethod);
  };

  // (Đã tích hợp cổng thanh toán PayOS tự động)

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
        <img src={img} alt="tour" className="cart-tour-img" />
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
      title: "Hành khách & Dịch vụ",
      key: "travelers",
      width: 280,
      render: (_, record) => {
        const handleDetailChange = (field, val) => {
          updateCartItemDetails(record.tourId, { [field]: val });
          fetchCartData();
        };

        return (
          <div className="cart-item-details-panel">
            <div className="cart-detail-subrow">
              <span className="subrow-label">Người lớn:</span>
              <InputNumber
                size="small"
                min={1}
                value={record.adultsQuantity || 1}
                onChange={(v) => handleDetailChange("adultsQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
            <div className="cart-detail-subrow">
              <span className="subrow-label">Cao tuổi:</span>
              <InputNumber
                size="small"
                min={0}
                value={record.seniorsQuantity || 0}
                onChange={(v) => handleDetailChange("seniorsQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
            <div className="cart-detail-subrow">
              <span className="subrow-label">Trẻ em:</span>
              <InputNumber
                size="small"
                min={0}
                value={record.childrenQuantity || 0}
                onChange={(v) => handleDetailChange("childrenQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
            <div className="cart-detail-subrow">
              <span className="subrow-label">Trẻ nhỏ:</span>
              <InputNumber
                size="small"
                min={0}
                value={record.toddlersQuantity || 0}
                onChange={(v) => handleDetailChange("toddlersQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
            <div className="cart-detail-subrow">
              <span className="subrow-label">Phụ thu Visa:</span>
              <InputNumber
                size="small"
                min={0}
                value={record.visaQuantity || 0}
                onChange={(v) => handleDetailChange("visaQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
            <div className="cart-detail-subrow">
              <span className="subrow-label">Phòng đơn:</span>
              <InputNumber
                size="small"
                min={0}
                value={record.singleRoomQuantity || 0}
                onChange={(v) => handleDetailChange("singleRoomQuantity", v)}
                style={{ width: 60 }}
              />
            </div>
          </div>
        );
      },
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
          className="cart-delete-btn"
          onClick={() => handleDelete(record.tourId)}
        />
      ),
    },
  ];

  return (
    <div>
      <BoxHead title="Danh sách đặt chỗ" subtitle="Xem lại và đặt tour của bạn" />

      {/* Cart table */}
      {cartItems.length === 0 && !loading ? (
        <Empty
          image={<ShoppingCartOutlined className="cart-empty-icon" />}
          description="Danh sách đặt chỗ của bạn đang trống"
        >
          <Button type="primary" onClick={() => navigate("/categories")}>
            Khám phá tour ngay
          </Button>
        </Empty>
      ) : (
        <>
          <Card bordered={false} className="cart-table-card" style={{ marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={cartItems}
              rowKey="tourId"
              loading={loading}
              pagination={false}
              scroll={{ x: 700 }}
            />
            <Divider />
            <div className="cart-total-bar">
              <Text className="cart-total-label">Tổng đơn hàng:</Text>
              <Title level={3} className="cart-total-value">
                {total.toLocaleString("vi-VN")}đ
              </Title>
            </div>
          </Card>

          {/* Order form */}
          <Card
            title={<Title level={4} style={{ margin: 0 }}>Thông tin khách hàng</Title>}
            bordered={false}
            className="cart-form-card"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOrder}
              style={{ maxWidth: 600 }}
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

              {/* === PHƯƠNG THỨC THANH TOÁN === */}
              <Form.Item label={<Text strong style={{ fontSize: 16 }}>Phương thức thanh toán</Text>}>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="payment-method-group"
                >
                  <div className="payment-method-options">
                    <div
                      className={`payment-method-card ${paymentMethod === "bank_transfer" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("bank_transfer")}
                    >
                      <Radio value="bank_transfer" />
                      <div className="payment-method-content">
                        <div className="payment-method-icon bank">
                          <BankOutlined />
                        </div>
                        <div className="payment-method-info">
                          <Text strong>Chuyển khoản ngân hàng</Text>
                          <Text type="secondary" className="payment-method-desc">
                            Thanh toán qua QR Code / chuyển khoản
                          </Text>
                        </div>
                        <Tag color="blue" className="payment-method-tag">PayOS</Tag>
                      </div>
                    </div>

                    <div
                      className={`payment-method-card ${paymentMethod === "cash" ? "active" : ""}`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <Radio value="cash" />
                      <div className="payment-method-content">
                        <div className="payment-method-icon cash">
                          <DollarOutlined />
                        </div>
                        <div className="payment-method-info">
                          <Text strong>Thanh toán tiền mặt</Text>
                          <Text type="secondary" className="payment-method-desc">
                            Thanh toán khi nhận dịch vụ
                          </Text>
                        </div>
                        <Tag color="green" className="payment-method-tag">Tiện lợi</Tag>
                      </div>
                    </div>
                  </div>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                  loading={ordering}
                  className="btn-order"
                  block
                >
                  {paymentMethod === "bank_transfer" ? "Thanh toán qua PayOS" : "Xác nhận đặt tour"}
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
