import { theme } from "antd";

const customTheme = {
  token: {
    colorPrimary: "#1B4F9C",
    colorLink: "#1B4F9C",
    colorLinkHover: "#123A75",
    colorLinkActive: "#123A75",
    colorText: "#333",
    colorTextSecondary: "#666",
    colorTextTertiary: "#999",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#d9d9d9",
    colorBorderSecondary: "#f0f0f0",
    colorSuccess: "#138808",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1B4F9C",
    fontFamily:
      'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
      colorTextPlaceholder: "#999",
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Menu: {
      itemSelectedBg: "#1B4F9C",
      itemSelectedColor: "#ffffff",
      itemHoverColor: "#1B4F9C",
      itemHoverBg: "rgba(27, 79, 156, 0.08)",
      subMenuItemBg: "#ffffff",
    },
  },
  algorithm: theme.defaultAlgorithm,
};

export default customTheme;
