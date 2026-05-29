import { BrowserRouter as Router } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { RenderRouter } from "./routers";
import AIChat from "./components/AIChat/AIChat";
import "./index.css";

// Cấu hình theme Ant Design: màu travel xanh lá + font Inter
const theme = {
  token: {
    colorPrimary: "#00b96b",          // Xanh lá travel
    colorBgLayout: "#f5f6fa",
    borderRadius: 10,
    fontFamily: "'Inter', sans-serif",
    colorLink: "#00b96b",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: "#001529",
      siderBg: "#001529",
      bodyBg: "#f5f6fa",
    },
    Menu: {
      darkItemBg: "#001529",
      darkSubMenuItemBg: "#000c17",
      darkItemSelectedBg: "#00b96b",
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      <Router>
        <RenderRouter />
        <AIChat />
      </Router>
    </ConfigProvider>
  );
}

export default App;
