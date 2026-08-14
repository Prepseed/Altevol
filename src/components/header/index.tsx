"use client";

import React, { useState } from "react";
import { Layout, Button, Drawer, Menu, Image } from "antd";
import {
  MenuOutlined,
  HomeOutlined,
  FormOutlined,
  LoginOutlined,
  TeamOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { updateUserData } from "@/redux/actions/ApiActions";
import { useMessage } from "@/components/layout";
import usersApi from "@/axios/users";
import Link from "next/link";
import styles from "./index.module.css";
import branding from "@/config/branding";

const { Header: AntHeader } = Layout;

export default function Header() {
  const dispatch = useDispatch();
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const isAdmin = userData.role === "admin" || userData.role === "super";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
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
  };

  return (
    <AntHeader className={styles.header}>
      <div className={styles.headerContent}>
        <Button
          type="text"
          className={styles.menuButton}
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
        />
        <Image
          src={branding.logo}
          alt={branding.brandName}
          preview={false}
          className={styles.logo}
        />
      </div>
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          disabled={logoutLoading}
          items={[
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
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "Logout",
            },
          ]}
          onClick={({ key }) => {
            if (key === "logout") handleLogout();
            else setDrawerOpen(false);
          }}
        />
      </Drawer>
    </AntHeader>
  );
}
