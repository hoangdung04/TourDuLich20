import { useRoutes, Navigate } from "react-router-dom";

// Layouts
import ClientLayout from "../Layout/client/ClientLayout/ClientLayout";
import AdminLayout from "../Layout/admin/AdminLayout/AdminLayout";

// Auth guard
import ProtectedRoute from "../components/ProtectedRoute";

// Client Pages
import Home from "../Pages/client/Home/Home";
import Categories from "../Pages/client/Categories";
import Tours from "../Pages/client/Tours";
import TourDetail from "../Pages/client/TourDetail";
import Cart from "../Pages/client/Cart";
import OrderSuccess from "../Pages/client/OrderSuccess";
import OrderHistory from "../Pages/client/OrderHistory/OrderHistory";
import ClientAuth from "../Pages/client/ClientAuth/ClientAuth";
import ForgotPassword from "../Pages/client/ForgotPassword/ForgotPassword";
import ChangePassword from "../Pages/client/ChangePassword/ChangePassword";
import Chat from "../Pages/client/Chat/Chat";
import ArticleList from "../Pages/client/ArticleList/ArticleList";
import ArticleDetail from "../Pages/client/ArticleDetail/ArticleDetail";

// Admin Auth
import AdminLogin from "../Pages/admin/AdminLogin/AdminLogin";

// Admin Dashboard
import AdminDashboard from "../Pages/admin/AdminDashboard/AdminDashboard";

// Admin Pages – Tours
import AdminTours from "../Pages/admin/AdminTours";
import AdminTourCreate from "../Pages/admin/AdminTourCreate";
import AdminTourEdit from "../Pages/admin/AdminTourEdit";
import AdminTourDetail from "../Pages/admin/AdminTourDetail";

// Admin Pages – Orders
import AdminOrders from "../Pages/admin/AdminOrders/AdminOrders";
import AdminOrderDetail from "../Pages/admin/AdminOrderDetail/AdminOrderDetail";

// Admin Pages – Categories
import AdminCategories from "../Pages/admin/AdminCategories";
import AdminCategoryCreate from "../Pages/admin/AdminCategoryCreate";
import AdminCategoryEdit from "../Pages/admin/AdminCategoryEdit";
import AdminCategoryDetail from "../Pages/admin/AdminCategoryDetail";

// Admin Pages - Chat
import AdminChat from "../Pages/admin/AdminChat/AdminChat";

// Admin Pages – Phân quyền
import AdminAccounts from "../Pages/admin/AdminAccounts/AdminAccounts";
import AdminAccountCreate from "../Pages/admin/AdminAccountCreate/AdminAccountCreate";
import AdminAccountEdit from "../Pages/admin/AdminAccountEdit/AdminAccountEdit";
import AdminRoles from "../Pages/admin/AdminRoles/AdminRoles";
import AdminRoleCreate from "../Pages/admin/AdminRoleCreate/AdminRoleCreate";
import AdminRoleEdit from "../Pages/admin/AdminRoleEdit/AdminRoleEdit";
import AdminPermissions from "../Pages/admin/AdminPermissions/AdminPermissions";

// Admin Pages – Bài viết
import AdminArticles from "../Pages/admin/AdminArticles/AdminArticles";
import AdminArticleCreate from "../Pages/admin/AdminArticleCreate/AdminArticleCreate";
import AdminArticleEdit from "../Pages/admin/AdminArticleEdit/AdminArticleEdit";

export const RenderRouter = () => {
  const routes = useRoutes([
    // ============================
    // CLIENT ROUTES
    // ============================
    {
      path: "/",
      element: <ClientLayout />,
      children: [
        { path: "/",               element: <Home /> },
        { path: "/categories",     element: <Categories /> },
        { path: "/tours/:slugCategory",  element: <Tours /> },
        { path: "/tours/detail/:slugTour", element: <TourDetail /> },
        { path: "/cart",           element: <Cart /> },
        { path: "/order/success",  element: <OrderSuccess /> },
        { path: "/order/history",  element: <OrderHistory /> },
        { path: "/change-password", element: <ChangePassword /> },
        { path: "/chat",           element: <Chat /> },
        { path: "/articles",       element: <ArticleList /> },
        { path: "/articles/:slug", element: <ArticleDetail /> },
      ],
    },

    // ============================
    // ADMIN LOGIN (không bảo vệ)
    // ============================
    {
      path: "/admin/login",
      element: <AdminLogin />,
    },

    // ============================
    // CLIENT LOGIN / ĐĂNG KÝ (không bảo vệ)
    // ============================
    {
      path: "/login",
      element: <ClientAuth />,
    },
    {
      path: "/register",
      element: <ClientAuth />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },

    // ============================
    // ADMIN ROUTES (cần đăng nhập)
    // ============================
    {
      path: "/admin",
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        // Redirect /admin → /admin/dashboard
        { index: true, element: <Navigate to="dashboard" replace /> },

        // Dashboard
        { path: "dashboard", element: <AdminDashboard /> },

        // Tours
        { path: "tours", element: <AdminTours /> },
        { path: "tours/create", element: <AdminTourCreate /> },
        { path: "tours/edit/:id", element: <AdminTourEdit /> },
        { path: "tours/detail/:id", element: <AdminTourDetail /> },

        // Orders
        { path: "orders", element: <AdminOrders /> },
        { path: "orders/:id", element: <AdminOrderDetail /> },

        // Categories
        { path: "categories", element: <AdminCategories /> },
        { path: "categories/create", element: <AdminCategoryCreate /> },
        { path: "categories/edit/:id", element: <AdminCategoryEdit /> },
        { path: "categories/detail/:id", element: <AdminCategoryDetail /> },

        // Accounts
        { path: "accounts", element: <AdminAccounts /> },
        { path: "accounts/create", element: <AdminAccountCreate /> },
        { path: "accounts/edit/:id", element: <AdminAccountEdit /> },
        {
          path: "chat",
          element: <AdminChat />
        },
        // Phân quyền
        {
          path: "roles", element: <AdminRoles /> },
        { path: "roles/create", element: <AdminRoleCreate /> },
        { path: "roles/edit/:id", element: <AdminRoleEdit /> },
        { path: "roles/permissions", element: <AdminPermissions /> },

        // Bài viết
        { path: "articles", element: <AdminArticles /> },
        { path: "articles/create", element: <AdminArticleCreate /> },
        { path: "articles/edit/:id", element: <AdminArticleEdit /> },
      ],
    },
  ]);

  return routes;
};
