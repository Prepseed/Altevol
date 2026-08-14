"use client";

import React, { useMemo, useState } from "react";
import {
  PhoneOutlined,
  KeyOutlined,
  ReloadOutlined,
  FormOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Space,
} from "antd";
import { useMessage } from "@/components/layout";
import { useRouter } from "next/navigation";
import usersApi from "@/axios/users";
import branding from "@/config/branding";

const { Text } = Typography;
const isDev = process.env.NODE_ENV === "development";

type LoginForm = {
  mobileNumber: string;
  otp?: string;
};

export default function Login() {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const message = useMessage();
  const router = useRouter();

  const formName = useMemo(
    () => `login-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    []
  );

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    try {
      const mobileNumber = form.getFieldValue("mobileNumber");
      if (!mobileNumber) {
        message.error("Please enter your mobile number");
        return;
      }

      const cleanedMobile = String(mobileNumber).replace(/[+\s-]/g, "");
      if (!/^\d{10}$/.test(cleanedMobile)) {
        message.error("Please enter a valid 10-digit mobile number");
        return;
      }

      setSendingOtp(true);
      const response = await usersApi.sendOTP(mobileNumber);

      if (response.success) {
        setOtpSent(true);
        setCountdown(60);
        if (isDev && response.otp != null) {
          setDevOtp(String(response.otp));
        }
        message.success(
          isDev
            ? "Development mode: SMS not sent. Use the OTP shown below or master OTP."
            : response.message || "OTP sent successfully!"
        );
      } else {
        message.error(
          response.error ||
            response.message ||
            "Failed to send OTP. Please try again."
        );
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      message.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const mobileNumber = form.getFieldValue("mobileNumber");
      if (!mobileNumber) {
        message.error("Please enter your mobile number");
        return;
      }

      setResendingOtp(true);
      const response = await usersApi.resendOtp(mobileNumber);

      if (response.success) {
        setCountdown(60);
        if (isDev && response.otp != null) {
          setDevOtp(String(response.otp));
        }
        message.success(
          isDev
            ? "Development mode: SMS not sent. Use the OTP shown below or master OTP."
            : response.message || "OTP resent successfully!"
        );
      } else {
        message.error(
          response.error ||
            response.message ||
            "Failed to resend OTP. Please try again."
        );
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendingOtp(false);
    }
  };

  const onFinish = async (values: LoginForm) => {
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    setLoading(true);
    try {
      const response = await usersApi.verifyOtp(values.mobileNumber, values.otp || "");

      if (response.success) {
        if (response.token) {
          localStorage.setItem("token", response.token);
        }
        if (response.data) {
          localStorage.setItem("userData", JSON.stringify(response.data));
        }
        message.success("Login successful!");
        form.resetFields();
        setOtpSent(false);
        setCountdown(0);
        setDevOtp(null);
        window.location.replace("/dashboard");
      } else {
        message.error(response.error || "Login failed. Please try again.");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const entryFormButton = (
    <Button
      type="default"
      onClick={() => router.push("/entry-form")}
      block
      size="large"
      style={{
        height: "44px",
        borderRadius: "12px",
        border: `1px solid ${branding.primaryColor}`,
        fontSize: "15px",
        fontWeight: 500,
        color: branding.primaryColor,
      }}
    >
      <FormOutlined style={{ marginRight: 8 }} />
      Entry Form
    </Button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryColorDark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Row justify="center" style={{ width: "100%" }}>
        <Col>
          <Card
            style={{
              width: "400px",
              maxWidth: "100%",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "none",
            }}
            styles={{ body: { padding: "30px" } }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  src={branding.logo}
                  alt={branding.brandName}
                  style={{
                    width: 220,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <Text type="secondary" style={{ fontSize: "15px" }}>
                {branding.login.subtitle}
              </Text>
            </div>

            <Form
              form={form}
              name={formName}
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              preserve={false}
            >
              <Form.Item
                name="mobileNumber"
                label="Mobile Number"
                rules={[
                  { required: true, message: "Please input your mobile number!" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Please enter a valid 10-digit mobile number!",
                    transform: (value) => value?.replace(/[+\s-]/g, ""),
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Enter 10-digit mobile number"
                  disabled={loading || otpSent}
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    form.setFieldsValue({ mobileNumber: value });
                    if (otpSent) {
                      setOtpSent(false);
                      setCountdown(0);
                      setDevOtp(null);
                    }
                  }}
                />
              </Form.Item>

              {!otpSent ? (
                <>
                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      onClick={handleSendOtp}
                      loading={sendingOtp}
                      block
                      size="large"
                      style={{
                        height: "48px",
                        borderRadius: "12px",
                        background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColorDark})`,
                        border: "none",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {!sendingOtp && (
                        <>
                          <PhoneOutlined style={{ marginRight: 8 }} />
                          Send OTP
                        </>
                      )}
                    </Button>
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>{entryFormButton}</Form.Item>
                </>
              ) : (
                <>
                  {isDev && devOtp && (
                    <Alert
                      type="info"
                      showIcon
                      message={`Dev OTP: ${devOtp}`}
                      description="SMS is not sent in development. Use this OTP or your master OTP to sign in."
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form.Item
                    name="otp"
                    label="OTP"
                    rules={[
                      { required: true, message: "Please input the OTP!" },
                      {
                        pattern: /^[0-9]{6}$/,
                        message: "Please enter a valid 6-digit OTP!",
                      },
                    ]}
                  >
                    <Input
                      prefix={<KeyOutlined />}
                      placeholder="Enter 6-digit OTP"
                      disabled={loading}
                      maxLength={6}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        style={{
                          height: "48px",
                          borderRadius: "12px",
                          background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColorDark})`,
                          border: "none",
                          fontSize: "16px",
                          fontWeight: 600,
                        }}
                      >
                        {!loading && (
                          <>
                            <KeyOutlined style={{ marginRight: 8 }} />
                            Sign In
                          </>
                        )}
                      </Button>
                      <Button
                        type="link"
                        onClick={handleResendOtp}
                        loading={resendingOtp}
                        disabled={countdown > 0}
                        block
                        style={{ fontSize: "14px", color: branding.primaryColor }}
                      >
                        {countdown > 0 ? (
                          `Resend OTP in ${countdown}s`
                        ) : (
                          <>
                            <ReloadOutlined style={{ marginRight: 4 }} />
                            Resend OTP
                          </>
                        )}
                      </Button>
                      {entryFormButton}
                    </Space>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
