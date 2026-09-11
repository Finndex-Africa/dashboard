"use client";

import { useState } from "react";
import Layout from "antd/es/layout";
import Menu from "antd/es/menu";
import Drawer from "antd/es/drawer";
import Avatar from "antd/es/avatar";
import Button from "antd/es/button";
import {
  HomeOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TeamOutlined,
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  CalendarOutlined,
  BellOutlined,
  TrophyOutlined,
  MenuOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  FlagOutlined,
  NotificationOutlined,
  ShoppingOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import LanguageSwitcher from "@/components/global/LanguageSwitcher";
import CurrencySwitcher from "@/components/global/CurrencySwitcher";
import { getRoleRedirectPath } from "@/lib/role-redirects";
import { ROUTE_ROLES } from "@/lib/route-access";
import { clearAuthStorage } from "@/lib/auth-cookie";

const { Content, Sider } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // No top-right dropdown - Profile is now in the sidebar

  // Define all menu items with role restrictions
  // admin = general admin (full access), admin_property = properties only, admin_services = services only
  const allMenuItems = [
    {
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: t("dashboard"),
      roles: ROUTE_ROLES["/dashboard"],
    },
    {
      key: "/properties",
      icon: <AppstoreOutlined />,
      label: t("properties"),
      roles: ROUTE_ROLES["/properties"],
    },
    {
      key: "/services",
      icon: <ShopOutlined />,
      label: t("services"),
      roles: ROUTE_ROLES["/services"],
    },
    {
      key: "/buy-sell",
      icon: <ShoppingOutlined />,
      label: t("buyAndSell"),
      roles: ROUTE_ROLES["/buy-sell"],
    },
    {
      key: "/bookings",
      icon: <CalendarOutlined />,
      label: t("bookings"),
      roles: ROUTE_ROLES["/bookings"],
    },
    {
      key: "/advertisements",
      icon: <TrophyOutlined />,
      label: t("advertisements"),
      roles: ROUTE_ROLES["/advertisements"],
    },
    {
      key: "/users",
      icon: <TeamOutlined />,
      label: t("users"),
      roles: ROUTE_ROLES["/users"],
    },
    {
      key: "/verifications",
      icon: <SafetyCertificateOutlined />,
      label: t("verifications"),
      roles: ROUTE_ROLES["/verifications"],
    },
    {
      key: "/user-reports",
      icon: <FlagOutlined />,
      label: t("userReports"),
      roles: ROUTE_ROLES["/user-reports"],
    },
    {
      key: "/service-requests",
      icon: <NotificationOutlined />,
      label: t("serviceRequests"),
      roles: ROUTE_ROLES["/service-requests"],
    },
    {
      key: "/notifications",
      icon: <BellOutlined />,
      label: t("notifications"),
      roles: ROUTE_ROLES["/notifications"],
    },
    {
      key: "/messages",
      icon: <MessageOutlined />,
      label: t("messages"),
      roles: ROUTE_ROLES["/messages"],
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: t("profile"),
      roles: ROUTE_ROLES["/profile"],
    },
    {
      // Holds the USD/RWF exchange-rate controls. Scoped to full admins because
      // GET/PATCH /currency/settings is guarded by @Roles(UserRole.ADMIN) —
      // showing it to the scoped admin roles would render a page that 403s.
      key: "/settings",
      icon: <SettingOutlined />,
      label: t("settings"),
      roles: ROUTE_ROLES["/settings"],
    },
  ];

  // Filter menu items based on user role
  const menuItems = user?.role
    ? allMenuItems
        .filter((item) => (item.roles as readonly string[]).includes(user.role))
        .map(({ roles, ...item }) => item)
    : [];

  const handleLogout = () => {
    // Clear dashboard auth data (only auth keys)
    clearAuthStorage();

    // Redirect to frontend and trigger logout there as well
    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
    window.location.href = `${websiteUrl}/?logout=true`;
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            padding: "16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#52c41a",
              secondary: "#fff",
            },
            style: {
              border: "1px solid #52c41a20",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff6b6b",
              secondary: "#fff",
            },
            style: {
              border: "1px solid #ff6b6b20",
            },
          },
          loading: {
            iconTheme: {
              primary: "#0000FF",
              secondary: "#fff",
            },
          },
        }}
      />

      <Layout style={{ minHeight: "100vh" }}>
        {/* Desktop Sidebar - Hidden on mobile (md and below) */}
        <Sider
          width={260}
          breakpoint="md"
          collapsedWidth={0}
          trigger={null}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            background: "#fff",
            borderRight: "1px solid #ebebeb",
            zIndex: 200,
          }}
          className="hidden md:block"
        >
          {/* Sidebar Logo */}
          <div
            className="cursor-pointer flex py-6 px-4 border-b border-gray-200"
            onClick={() => {
              const redirectPath = user?.role
                ? getRoleRedirectPath(user.role)
                : "/properties";
              router.push(redirectPath);
            }}
          >
            <img
              src="/images/logos/Header%20Logo-Findafriq.png"
              alt={t("logoAlt")}
              className="h-10 object-contain"
            />
          </div>

          {/* Sidebar Menu */}
          <Menu
            mode="vertical"
            selectedKeys={[pathname]}
            onClick={({ key }) => router.push(key)}
            items={menuItems}
            style={{
              border: "none",
              fontSize: "15px",
              paddingTop: "16px",
            }}
          />

          {/* Sidebar Footer - Language + Currency + Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-3">
            <LanguageSwitcher block />
            <CurrencySwitcher block />
            <Button
              block
              size="large"
              onClick={handleLogout}
              icon={<LogoutOutlined />}
              style={{
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              {t("logOut")}
            </Button>
          </div>
        </Sider>

        {/* Main Layout - Adjust margin for sidebar on desktop */}
        <Layout className="md:ml-[260px]" style={{ position: "relative" }}>
          {/* Mobile-only header with burger menu — hidden on md+ */}
          <div className="block md:hidden sticky top-0 z-[100]">
            <div
              className="flex items-center justify-between"
              style={{
                width: "100%",
                padding: "0 16px",
                background: "#fff",
                borderBottom: "1px solid #ebebeb",
                height: "56px",
                boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.06)",
              }}
            >
              {/* Logo (mobile) */}
              <div
                className="cursor-pointer flex items-center"
                onClick={() => {
                  const redirectPath = user?.role
                    ? getRoleRedirectPath(user.role)
                    : "/properties";
                  router.push(redirectPath);
                }}
              >
                <img
                  src="/images/logos/Header%20Logo-Findafriq.png"
                  alt={t("logoAlt")}
                  className="h-8 object-contain"
                />
              </div>

              {/* Burger menu (mobile) */}
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "16px" }} />}
                onClick={() => setDrawerOpen(true)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          <Drawer
            title={null}
            placement="right"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            width={320}
            closable={false}
            styles={{
              body: { padding: 0 },
              header: { display: "none" },
            }}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  size={48}
                  style={{ backgroundColor: "#0000FF" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "16px" }}>
                    {`${user?.firstName || user?.email?.split("@")[0] || t("defaultUserName")}${user?.lastName ? " " + user.lastName : ""}`}
                  </div>
                  <div style={{ fontSize: "14px", color: "#717171" }}>
                    {user?.role && tRoles.has(user.role) ? tRoles(user.role) : tRoles("user")}
                  </div>
                </div>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setDrawerOpen(false)}
              />
            </div>

            {/* Drawer Menu Items */}
            <Menu
              mode="vertical"
              selectedKeys={[pathname]}
              onClick={({ key }) => {
                router.push(key);
                setDrawerOpen(false);
              }}
              items={menuItems}
              style={{
                border: "none",
                fontSize: "16px",
              }}
            />

            {/* Drawer Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 space-y-3">
              <LanguageSwitcher block />
              <CurrencySwitcher block />
              <Button
                block
                size="large"
                onClick={handleLogout}
                style={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              >
                <LogoutOutlined /> {t("logOut")}
              </Button>
            </div>
          </Drawer>

          {/* Main Content */}
          <Content
            style={{
              background: "#f7f7f7",
              minHeight: "calc(100vh - 56px)",
              padding: "32px 20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              className="max-w-7xl mx-auto"
              style={{ position: "relative", zIndex: 2 }}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
