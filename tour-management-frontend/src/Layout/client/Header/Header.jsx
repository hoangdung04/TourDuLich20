import { Layout, Menu, Badge, Typography, Button, Space, Avatar, Dropdown, Input, List } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  GlobalOutlined,
  LoginOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  HistoryOutlined,
  KeyOutlined,
  SearchOutlined,
  MessageOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCartCount } from "../../../utils/cart";
import { isLoggedIn, getUser, clearAuth, isAdmin } from "../../../utils/auth";
import { clientLogout, searchTours } from "../../../services/api";
import { useState, useEffect, useRef } from "react";
import "./Header.css";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
  const [cartCount, setCartCount] = useState(getCartCount());
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    window.addEventListener("storage", update);
    window.addEventListener("cartUpdated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
  }, [location.pathname]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchTours(value);
        setSearchResults(res.data.tours || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectTour = (tour) => {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
    navigate(`/tours/detail/${tour.slug}`);
  };

  // Active menu key
  const selectedKey = () => {
    if (location.pathname === "/")               return "home";
    if (location.pathname.startsWith("/categories")) return "tours";
    if (location.pathname.startsWith("/tours"))  return "tours";
    if (location.pathname === "/cart")           return "cart";
    if (location.pathname === "/chat")           return "chat";
    if (location.pathname.startsWith("/articles")) return "articles";
    return "home";
  };

  const admin = isAdmin();

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: "tours",
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">Danh mục</Link>,
    },
    {
      key: "cart",
      icon: (
        <Badge count={cartCount} size="small" offset={[4, -2]}>
          <ShoppingCartOutlined style={{ fontSize: 18, color: "#4b5563" }} />
        </Badge>
      ),
      label: <Link to="/cart">Đặt chỗ</Link>,
    },
    {
      key: "articles",
      icon: <ReadOutlined />,
      label: <Link to="/articles">Cẩm nang</Link>,
    },
    // Chỉ hiển thị Chat nếu KHÔNG PHẢI là Admin
    ...(!admin ? [{
      key: "chat",
      icon: <MessageOutlined />,
      label: <Link to="/chat">Chat</Link>,
    }] : []),
  ];

  const loggedIn = isLoggedIn();
  const user = getUser();

  const handleLogout = async () => {
    try { await clientLogout(); } catch { /* bỏ qua lỗi */ }
    clearAuth();
    window.location.href = "/";
  };

  const userMenuItems = [
    ...(admin ? [{
      key: "admin",
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Trang quản trị</Link>,
    }, { type: "divider" }] : []),
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: <Link to="/order/history">Lịch sử đặt tour</Link>,
    },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: <Link to="/change-password">Đổi mật khẩu</Link>,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="client-header">
      {/* Logo */}
      <div className="header-logo" onClick={() => navigate("/")}>
        <GlobalOutlined className="logo-icon" />
        <Text strong className="logo-text">TourVN</Text>
      </div>

      {/* Navigation menu */}
      <Menu
        theme="light"
        mode="horizontal"
        selectedKeys={[selectedKey()]}
        items={menuItems}
        className="header-menu"
        disabledOverflow
      />

      {/* ══════ Search bar ══════ */}
      <div className="header-search" ref={searchRef}>
        <Input
          placeholder="Tìm kiếm tour, điểm đến..."
          prefix={<SearchOutlined className="header-search-icon" />}
          className="header-search-input"
          value={searchValue}
          onChange={(e) => {
            handleSearchChange(e.target.value);
            if (!searchOpen) setSearchOpen(true);
          }}
          onFocus={() => {
            if (searchValue.trim()) setSearchOpen(true);
          }}
          allowClear
        />

        {/* Dropdown results */}
        {searchOpen && searchValue.trim() && (
          <div className="header-search-dropdown">
            {searching ? (
              <div className="search-loading">
                <SearchOutlined style={{ fontSize: 20, display: "block", marginBottom: 6, opacity: 0.4 }} />
                Đang tìm kiếm...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="search-empty">
                Không tìm thấy tour phù hợp với "{searchValue}"
              </div>
            ) : (
              <>
                <div className="search-dropdown-label">
                  KẾT QUẢ ({searchResults.length})
                </div>
                <div className="search-results-list">
                  {searchResults.slice(0, 8).map((tour) => (
                    <div
                      key={tour.id}
                      className="search-result-item"
                      onClick={() => handleSelectTour(tour)}
                    >
                      <img
                        src={tour.image || "https://placehold.co/64x46?text=Tour"}
                        alt={tour.title}
                        className="search-result-img"
                      />
                      <div className="search-result-info">
                        <div className="search-result-title">{tour.title}</div>
                        <div className="search-result-price">
                          <span className="search-result-special">
                            {tour.price_special?.toLocaleString("vi-VN")}đ
                          </span>
                          {tour.discount > 0 && (
                            <span className="search-result-discount">-{tour.discount}%</span>
                          )}
                        </div>
                      </div>
                      <span className="search-result-arrow">→</span>
                    </div>
                  ))}
                </div>
                {searchResults.length > 8 && (
                  <div className="search-more">
                    Xem tất cả {searchResults.length} kết quả →
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Auth area */}
      <div className="header-auth">
        {loggedIn ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="header-user" style={{ cursor: "pointer" }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#00b96b" }}
              />
              <Text className="header-username">{user?.fullName || "Admin"}</Text>
            </Space>
          </Dropdown>
        ) : (
          <Space size={8}>
            <Button
              type="text"
              className="header-register-btn"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </Button>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              className="header-login-btn"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </Space>
        )}
      </div>
    </AntHeader>
  );
}

export default Header;
