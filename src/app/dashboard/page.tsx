"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, QRCode, Table, Tag, Typography } from "antd";
import { useSelector } from "react-redux";
import branding from "@/config/branding";
import type { RootState } from "@/redux/store";
import usersApi from "@/axios/users";
import AdminDashboard from "@/components/admin-dashboard";
import { useMessage } from "@/components/layout";

const { Title, Text } = Typography;

type CheckInRecord = {
  id: string;
  uniqueCode: string;
  checkin: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

type UserBatch = {
  id?: string;
  name?: string;
  sport?: string;
  startTime?: string;
  endTime?: string;
};

function formatTime12(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatBatchTiming(batch: UserBatch) {
  const start = formatTime12(batch.startTime);
  const end = formatTime12(batch.endTime);
  if (!start || !end) return "";
  return `${start} – ${end}`;
}

function readUserBatch(value: unknown): UserBatch | null {
  if (!value || typeof value !== "object") return null;
  const batch = value as UserBatch;
  if (!batch.name) return null;
  return batch;
}

export default function DashboardPage() {
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const name = typeof userData.name === "string" ? userData.name : "";
  const role = typeof userData.role === "string" ? userData.role : "";
  const uniqueCode =
    typeof userData.uniqueCode === "string" ? userData.uniqueCode : "";
  const batch = readUserBatch(userData.batch);
  const showQr = role === "user" && Boolean(uniqueCode);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<CheckInRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadMyCheckIns = useCallback(async () => {
    if (role !== "user") return;
    setLogsLoading(true);
    try {
      const response = await usersApi.listMyCheckIns({ page, pageSize });
      if (response.success) {
        setLogs(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } else {
        message.error(response.error || "Failed to load check-ins");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to load check-ins");
    } finally {
      setLogsLoading(false);
    }
  }, [message, page, pageSize, role]);

  useEffect(() => {
    loadMyCheckIns();
  }, [loadMyCheckIns]);

  const handleCheckIn = async (codeToCheckIn = uniqueCode) => {
    if (!codeToCheckIn || checkingIn) return;
    setCheckingIn(true);
    try {
      const response = await usersApi.checkIn(codeToCheckIn);
      if (response.success) {
        message.success(
          response.data?.alreadyCheckedIn
            ? `${response.data?.name || codeToCheckIn} already checked in today`
            : response.message || "Checked in"
        );
        if (role === "user") {
          if (page === 1) {
            await loadMyCheckIns();
          } else {
            setPage(1);
          }
        }
        if (role === "guard") {
          setScanCode("");
        }
      } else {
        message.error(response.error || "Failed to check in");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to check in");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 8 }}>
        {branding.dashboard.title}
        {name ? `, ${name}` : ""}
      </Title>
      <Text type="secondary">{branding.dashboard.subtitle}</Text>

      {(role === "admin" || role === "super") && <AdminDashboard />}

      {showQr && (
        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => handleCheckIn(uniqueCode)}
            disabled={checkingIn}
            aria-label="Check in"
            style={{
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 8px 24px rgba(27, 79, 156, 0.08)",
              cursor: checkingIn ? "wait" : "pointer",
              opacity: checkingIn ? 0.7 : 1,
              display: "block",
              lineHeight: 0,
            }}
          >
            <QRCode
              value={uniqueCode}
              size={220}
              color={branding.primaryColor}
              bgColor="#ffffff"
              errorLevel="M"
            />
          </button>
          <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
            {uniqueCode}
          </Title>
          {batch ? (
            <div style={{ marginBottom: 8 }}>
              <Text strong>{batch.name}</Text>
              <br />
              <Text type="secondary">
                {[
                  batch.sport
                    ? batch.sport.charAt(0).toUpperCase() + batch.sport.slice(1)
                    : "",
                  formatBatchTiming(batch),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">No batch assigned yet</Text>
            </div>
          )}
          <Text type="secondary">
            {checkingIn
              ? "Checking in..."
              : "Click the QR to check in, or show it at the gate"}
          </Text>
        </div>
      )}

      {role === "guard" && (
        <div style={{ marginTop: 32, maxWidth: 420 }}>
          <Title level={4} style={{ marginBottom: 4 }}>
            Gate check-in
          </Title>
          <Text type="secondary">
            Enter or scan the player unique code
          </Text>
          <Form
            layout="vertical"
            style={{ marginTop: 16 }}
            onFinish={() => handleCheckIn(scanCode.trim())}
          >
            <Form.Item label="Unique code">
              <Input
                size="large"
                placeholder="SRT10-001"
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                autoCapitalize="characters"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={checkingIn}
              disabled={!scanCode.trim()}
              block
            >
              Check in
            </Button>
          </Form>
        </div>
      )}

      {role === "user" && (
        <div style={{ marginTop: 40 }}>
          <Title level={4} style={{ marginBottom: 4 }}>
            My check-ins
          </Title>
          <Text type="secondary">Your past entry logs</Text>
          <Table
            style={{ marginTop: 16 }}
            rowKey="id"
            loading={logsLoading}
            dataSource={logs}
            columns={[
              {
                title: "Checked in",
                dataIndex: "checkin",
                key: "checkin",
                render: (value: string) => formatDate(value),
              },
              {
                title: "Code",
                dataIndex: "uniqueCode",
                key: "uniqueCode",
              },
              {
                title: "",
                key: "today",
                width: 90,
                render: (_: unknown, record: CheckInRecord) =>
                  isToday(record.checkin) ? <Tag color="blue">Today</Tag> : null,
              },
            ]}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (count) => `${count} check-ins`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            locale={{ emptyText: "No check-ins yet" }}
          />
        </div>
      )}
    </div>
  );
}
