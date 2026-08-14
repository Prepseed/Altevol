"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Input,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import usersApi from "@/axios/users";
import batchesApi, { type BatchRecord } from "@/axios/batches";
import { useMessage } from "@/components/layout";
import type { RootState } from "@/redux/store";

const { Title, Text } = Typography;

type PersonRecord = {
  id: string;
  name: string;
  mobileNumber: string;
  uniqueCode: string;
  email: string;
  isActive: boolean;
  feesPaid: boolean;
  batch: {
    id: string;
    name: string;
    sport: string;
    startTime?: string;
    endTime?: string;
  } | null;
};

function isAdminRole(role: unknown) {
  return role === "admin" || role === "super";
}

export default function PeopleModule() {
  const router = useRouter();
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const allowed = isAdminRole(userData.role);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PersonRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<string | undefined>();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    if (!allowed) return;
    const response = await batchesApi.list();
    if (response.success) {
      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];
      setBatches(rows);
    } else {
      setBatches([]);
      message.error(response.error || "Failed to load batches");
    }
  }, [allowed, message]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await usersApi.listPeople({
        search: search.trim() || undefined,
        batch: batchFilter,
        isActive: activeFilter,
        page,
        pageSize,
      });
      if (response.success) {
        setItems(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } else {
        message.error(response.error || "Failed to load people");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to load people");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, allowed, batchFilter, message, page, pageSize, search]);

  useEffect(() => {
    if (userData.role && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router, userData.role]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePerson = useCallback(
    async (
      id: string,
      payload: { isActive?: boolean; batchId?: string }
    ) => {
      setUpdatingId(id);
      try {
        const response = await usersApi.updatePerson(id, payload);
        if (response.success) {
          message.success(response.message || "Updated");
          await load();
        } else {
          message.error(response.error || "Failed to update user");
        }
      } catch (error) {
        const err = error as { message?: string };
        message.error(err.message || "Failed to update user");
      } finally {
        setUpdatingId(null);
      }
    },
    [load, message]
  );

  const columns: ColumnsType<PersonRecord> = useMemo(
    () => [
      { title: "Name", dataIndex: "name", key: "name" },
      { title: "Unique code", dataIndex: "uniqueCode", key: "uniqueCode" },
      { title: "Mobile", dataIndex: "mobileNumber", key: "mobileNumber" },
      {
        title: "Batch",
        key: "batch",
        width: 240,
        render: (_, record) => (
          <Select
            value={record.batch?.id}
            placeholder="Assign batch"
            style={{ width: 220 }}
            disabled={updatingId === record.id}
            onChange={(batchId) => updatePerson(record.id, { batchId })}
            options={batches.map((batch) => ({
              value: batch.id,
              label:
                batch.startTime && batch.endTime
                  ? `${batch.name} (${batch.startTime} – ${batch.endTime})`
                  : batch.name,
            }))}
          />
        ),
      },
      {
        title: "Fees",
        dataIndex: "feesPaid",
        key: "feesPaid",
        width: 100,
        render: (value: boolean) =>
          value ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>,
      },
      {
        title: "Active",
        dataIndex: "isActive",
        key: "isActive",
        width: 110,
        render: (value: boolean, record) => (
          <Popconfirm
            title={
              value
                ? "Mark inactive? They cannot login and fees will be unpaid."
                : "Mark active? Fees will be marked paid and they can login."
            }
            onConfirm={() =>
              updatePerson(record.id, { isActive: !value })
            }
            okText="Yes"
          >
            <Switch
              checked={value}
              loading={updatingId === record.id}
              checkedChildren="On"
              unCheckedChildren="Off"
            />
          </Popconfirm>
        ),
      },
    ],
    [batches, updatePerson, updatingId]
  );

  if (!allowed) {
    return null;
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>
        Manage People
      </Title>
      <Text type="secondary">
        Activate, deactivate, and move players between batches
      </Text>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginTop: 20,
          marginBottom: 16,
        }}
      >
        <Input.Search
          allowClear
          size="large"
          placeholder="Search name, mobile, code"
          style={{ width: 280 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
        <Select
          allowClear
          size="large"
          placeholder="Batch"
          style={{ width: 220 }}
          value={batchFilter}
          onChange={(value) => {
            setPage(1);
            setBatchFilter(value);
          }}
          options={batches.map((batch) => ({
            value: batch.id,
            label:
              batch.startTime && batch.endTime
                ? `${batch.name} (${batch.startTime} – ${batch.endTime})`
                : batch.name,
          }))}
        />
        <Select
          allowClear
          size="large"
          placeholder="Status"
          style={{ width: 160 }}
          value={activeFilter}
          onChange={(value) => {
            setPage(1);
            setActiveFilter(value);
          }}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </div>

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
          showTotal: (count) => `${count} people`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
        scroll={{ x: 880 }}
      />
    </div>
  );
}
