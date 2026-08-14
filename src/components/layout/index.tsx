"use client";

import "@ant-design/v5-patch-for-react-19";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfigProvider, App, Layout as AntLayout, Card } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { Provider, useDispatch, useSelector } from "react-redux";
import customTheme from "@/config/theme";
import store, { RootState } from "@/redux/store";
import { updateUserData } from "@/redux/actions/ApiActions";
import usersApi from "@/axios/users";
import Sidebar from "../sidebar";
import Footer from "../footer";
import Header from "../header";
import branding from "@/config/branding";

const { Content: AntContent } = AntLayout;

const MessageContext = createContext<ReturnType<typeof App.useApp>["message"] | null>(
  null
);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within Layout");
  }
  return context;
};

function Content({ children }: { children: React.ReactNode }) {
  const { FooterSize } = useSelector((state: RootState) => state.ui);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const dispatch = useDispatch();

  const isLoginPage = useMemo(
    () => pathname === "/" || pathname === "",
    [pathname]
  );

  const isPublicPage = useMemo(
    () => isLoginPage || pathname === "/entry-form" || pathname.startsWith("/entry-form?"),
    [isLoginPage, pathname]
  );

  const checkAuthentication = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (token) {
        const response = await usersApi.getUserData();
        if (response.success && response.data) {
          setIsAuthenticated(true);
          dispatch(updateUserData(response.data));
          localStorage.setItem("userData", JSON.stringify(response.data));
          if (pathname === "/" || pathname === "") {
            router.push("/dashboard");
          }
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          dispatch(updateUserData({}));
          const onPublicPage =
            pathname === "/" ||
            pathname === "" ||
            pathname === "/entry-form" ||
            pathname.startsWith("/entry-form?");
          if (!onPublicPage) {
            router.push("/");
          }
        }
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("userData");
        dispatch(updateUserData({}));
        const onPublicPage =
          pathname === "/" ||
          pathname === "" ||
          pathname === "/entry-form" ||
          pathname.startsWith("/entry-form?");
        if (!onPublicPage) {
          router.push("/");
        }
      }
    } catch {
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      dispatch(updateUserData({}));
    } finally {
      setLoading(false);
    }
  }, [dispatch, pathname, router]);

  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && isLoginPage) {
      router.push("/dashboard");
    }
    if (!isAuthenticated && !isPublicPage) {
      router.push("/");
    }
  }, [pathname, isAuthenticated, loading, isLoginPage, isPublicPage, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={branding.logo}
          alt={branding.brandName}
          style={{
            height: 140,
            width: "auto",
            maxWidth: "80%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated && !isPublicPage) {
    return <div style={{ minHeight: "100vh", background: "#f5f5f5" }} />;
  }

  if (isAuthenticated && isLoginPage) {
    return <div style={{ minHeight: "100vh", background: "#f5f5f5" }} />;
  }

  return (
    <MessageContext.Provider value={message}>
      <div
        style={{
          height: "100vh",
          width: "100%",
          background: "#f5f5f5",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <AntLayout
          style={{
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {!isPublicPage && <Sidebar />}
          <AntLayout
            style={{
              flex: 1,
              height: "100vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {!isPublicPage && <Header />}
            <AntContent
              style={{
                padding: isPublicPage ? 0 : 16,
                height: `calc(100vh - ${FooterSize}px)`,
                overflow: "auto",
                width: "100%",
                flex: 1,
                minWidth: 0,
              }}
            >
              {isPublicPage ? (
                children
              ) : (
                <Card styles={{ body: { padding: 24, width: "100%" } }}>
                  {children}
                </Card>
              )}
            </AntContent>
            {!isPublicPage && <Footer />}
          </AntLayout>
        </AntLayout>
      </div>
    </MessageContext.Provider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigProvider theme={customTheme}>
        <App>
          <Content>{children}</Content>
        </App>
      </ConfigProvider>
    </Provider>
  );
}
