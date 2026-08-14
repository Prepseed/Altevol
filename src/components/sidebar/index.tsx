"use client";

import Sider from "antd/es/layout/Sider";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Image, Button, Tooltip } from "antd";
import { updateSiderActive } from "@/redux/actions/UiActions";
import { updateUserData } from "@/redux/actions/ApiActions";
import { useMessage } from "@/components/layout";
import usersApi from "@/axios/users";
import styles from "./index.module.css";
import {
  HomeOutlined,
  FormOutlined,
  LoginOutlined,
  TeamOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import branding from "@/config/branding";
import type { RootState } from "@/redux/store";

export default function Sidebar() {
  const dispatch = useDispatch();
  const SiderActive = useSelector((state: RootState) => state.ui.SiderActive);
  const userData = useSelector((state: RootState) => state.api.userData);
  const isAdmin = userData.role === "admin" || userData.role === "super";
  const [collapsed, setCollapsed] = React.useState(!SiderActive);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const pathname = usePathname();
  const message = useMessage();

  const items = useMemo(
    () => [
      {
        key: "/dashboard",
        icon: <HomeOutlined />,
        label: <Link href="/dashboard">Home</Link>,
      },
      ...(isAdmin
        ? [
            {
              key: "/entry-forms",
              icon: <FormOutlined />,
              label: <Link href="/entry-forms">Entry Forms</Link>,
            },
            {
              key: "/check-ins",
              icon: <LoginOutlined />,
              label: <Link href="/check-ins">Check-ins</Link>,
            },
            {
              key: "/people",
              icon: <TeamOutlined />,
              label: <Link href="/people">Manage People</Link>,
            },
            {
              key: "/batches",
              icon: <AppstoreOutlined />,
              label: <Link href="/batches">Batches</Link>,
            },
          ]
        : []),
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
      },
    ],
    [isAdmin]
  );

  const selectedKeys = useMemo(() => {
    if (pathname?.startsWith("/batches")) return ["/batches"];
    if (pathname?.startsWith("/people")) return ["/people"];
    if (pathname?.startsWith("/check-ins")) return ["/check-ins"];
    if (pathname?.startsWith("/entry-forms")) return ["/entry-forms"];
    if (pathname?.startsWith("/dashboard")) return ["/dashboard"];
    return [];
  }, [pathname]);

  useEffect(() => {
    setCollapsed(!SiderActive);
  }, [SiderActive]);

  const handleCollapse = useCallback(
    (isCollapsed: boolean) => {
      setCollapsed(isCollapsed);
      dispatch(updateSiderActive(!isCollapsed));
    },
    [dispatch]
  );

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await usersApi.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      dispatch(updateUserData({}));
      message.success("Logged out successfully");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      dispatch(updateUserData({}));
    } finally {
      setLogoutLoading(false);
      window.location.href = "/";
    }
  }, [dispatch, message]);

  return (
    <Sider
      className={styles.sider}
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={handleCollapse}
      trigger={null}
      collapsedWidth={64}
      width={240}
    >
      <div
        className={`${styles.logoContainer} ${
          collapsed ? styles.logoContainerCollapsed : styles.logoContainerExpanded
        }`}
      >
        <Image
          src={branding.logo}
          alt={branding.brandName}
          preview={false}
          width={collapsed ? 40 : 180}
          height="auto"
          style={{ objectFit: "contain", transition: "all 0.3s ease-in-out" }}
        />
      </div>
      <Menu
        items={items}
        selectedKeys={selectedKeys}
        onClick={({ key }) => {
          if (key === "logout") handleLogout();
        }}
        disabled={logoutLoading}
        mode="inline"
        inlineCollapsed={collapsed}
      />
      <div
        className={`${styles.collapseBar} ${
          collapsed ? styles.collapseBarCollapsed : ""
        }`}
      >
        <Tooltip
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          placement="right"
        >
          <Button
            type="text"
            className={styles.collapseToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => handleCollapse(!collapsed)}
          />
        </Tooltip>
      </div>
    </Sider>
  );
}
