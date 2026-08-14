"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import entryFormApi, { type EntryFormRecord } from "@/axios/entryForm";
import { useMessage } from "@/components/layout";
import type { RootState } from "@/redux/store";

const { Title, Text } = Typography;

const HEARD_FROM_LABELS: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  friend_family: "Friend / Family",
  hoarding: "Hoarding",
  website: "Website",
  walk_in: "Walk-in",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  new: "blue",
  contacted: "gold",
  scheduled: "purple",
  converted: "green",
  closed: "default",
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

export default function EntryFormsModule() {
  const router = useRouter();
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const allowed = isAdminRole(userData.role);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EntryFormRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [selected, setSelected] = useState<EntryFormRecord | null>(null);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await entryFormApi.list({
        search: search.trim() || undefined,
        sport,
        status,
        page,
        pageSize,
      });
      if (response.success) {
        setItems(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } else {
        message.error(response.error || "Failed to load entry forms");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to load entry forms");
    } finally {
      setLoading(false);
    }
  }, [allowed, message, page, pageSize, search, sport, status]);

  useEffect(() => {
    if (userData.role && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router, userData.role]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<EntryFormRecord> = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Mobile",
        dataIndex: "mobileNumber",
        key: "mobileNumber",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Sport",
        dataIndex: "sport",
        key: "sport",
        render: (value: string) =>
          value ? value.charAt(0).toUpperCase() + value.slice(1) : "—",
      },
      {
        title: "Heard from",
        dataIndex: "howDidYouKnowAboutUs",
        key: "howDidYouKnowAboutUs",
        render: (value: string, record) =>
          value === "other" && record.howDidYouKnowOther
            ? record.howDidYouKnowOther
            : HEARD_FROM_LABELS[value] || value || "—",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value: string) => (
          <Tag color={STATUS_COLORS[value] || "default"}>
            {(value || "new").toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Submitted",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => formatDate(value),
      },
      {
        title: "",
        key: "action",
        width: 90,
        render: (_, record) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setSelected(record)}
          >
            View
          </Button>
        ),
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
        Entry Forms
      </Title>
      <Text type="secondary">
        Walk-in and public entry form submissions
      </Text>

      <Space wrap style={{ marginTop: 20, marginBottom: 16, width: "100%" }}>
        <Input.Search
          allowClear
          placeholder="Search name, mobile, email"
          style={{ width: 280 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
        <Select
          allowClear
          placeholder="Sport"
          style={{ width: 140 }}
          value={sport}
          onChange={(value) => {
            setPage(1);
            setSport(value);
          }}
          options={[
            { value: "cricket", label: "Cricket" },
            { value: "tennis", label: "Tennis" },
          ]}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 160 }}
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          options={[
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "scheduled", label: "Scheduled" },
            { value: "converted", label: "Converted" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </Space>

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
          showTotal: (count) => `${count} entries`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
        scroll={{ x: 980 }}
      />

      <Drawer
        title={selected?.name || "Entry form"}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={480}
      >
        {selected && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Mobile">
              {selected.mobileNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
            <Descriptions.Item label="Sport">
              {selected.sport
                ? selected.sport.charAt(0).toUpperCase() + selected.sport.slice(1)
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Player level">
              {selected.playerLevel || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Age">{selected.age ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Heard from">
              {selected.howDidYouKnowAboutUs === "other"
                ? selected.howDidYouKnowOther || "Other"
                : HEARD_FROM_LABELS[selected.howDidYouKnowAboutUs] ||
                  selected.howDidYouKnowAboutUs}
            </Descriptions.Item>
            <Descriptions.Item label="Visited before">
              {selected.visitedBefore ? "Yes" : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="Known person here">
              {selected.knownPersonHere
                ? selected.knownPersonName || "Yes"
                : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="Preferred visit">
              {formatDate(selected.preferredVisitDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              {selected.message || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[selected.status] || "default"}>
                {(selected.status || "new").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {formatDate(selected.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
