"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Col, Input, List, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import usersApi from "@/axios/users";
import { useMessage } from "@/components/layout";
import type { RootState } from "@/redux/store";

const { Title, Text } = Typography;

type CheckInRecord = {
  id: string;
  userId?: string;
  name: string;
  mobileNumber: string;
  email: string;
  uniqueCode: string;
  feesPaid: boolean;
  checkin: string;
};

function isAdminRole(role: unknown) {
  return role === "admin" || role === "super";
}

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

export default function CheckInsModule() {
  const router = useRouter();
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const allowed = isAdminRole(userData.role);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CheckInRecord[]>([]);
  const [recent, setRecent] = useState<CheckInRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await usersApi.listCheckIns({
        search: search.trim() || undefined,
        page,
        pageSize,
      });
      if (response.success) {
        setItems(response.data?.items || []);
        setRecent(response.data?.recent || []);
        setTotal(response.data?.total || 0);
      } else {
        message.error(response.error || "Failed to load check-ins");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  }, [allowed, message, page, pageSize, search]);

  useEffect(() => {
    if (userData.role && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router, userData.role]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<CheckInRecord> = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (value: string) => value || "—",
      },
      {
        title: "Unique code",
        dataIndex: "uniqueCode",
        key: "uniqueCode",
      },
      {
        title: "Mobile",
        dataIndex: "mobileNumber",
        key: "mobileNumber",
        render: (value: string) => value || "—",
      },
      {
        title: "Fees",
        dataIndex: "feesPaid",
        key: "feesPaid",
        width: 110,
        render: (value: boolean) =>
          value ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>,
      },
      {
        title: "Checked in",
        dataIndex: "checkin",
        key: "checkin",
        render: (value: string) => formatDate(value),
      },
    ],
    []
  );

  if (!allowed) {
    return null;
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>
        Check-ins
      </Title>
      <Text type="secondary">Entry logs till date</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={16}>
          <Input.Search
            allowClear
            placeholder="Search name, mobile, unique code"
            style={{ width: "100%", maxWidth: 360, marginBottom: 16 }}
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
          />
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={items}
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
            scroll={{ x: 720 }}
          />
        </Col>
        <Col xs={24} lg={8}>
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Title level={5} style={{ marginBottom: 4 }}>
              Recently checked in
            </Title>
            <Text type="secondary">Latest 10 entries</Text>
            <List
              style={{ marginTop: 12 }}
              loading={loading}
              locale={{ emptyText: "No check-ins yet" }}
              dataSource={recent}
              renderItem={(item) => (
                <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <List.Item.Meta
                    title={item.name || item.uniqueCode}
                    description={
                      <span>
                        {item.uniqueCode}
                        {item.mobileNumber ? ` · ${item.mobileNumber}` : ""}
                        <br />
                        {formatDate(item.checkin)}
                      </span>
                    }
                  />
                  {isToday(item.checkin) ? <Tag color="blue">Today</Tag> : null}
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
