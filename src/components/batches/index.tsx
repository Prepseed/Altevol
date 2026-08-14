"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import batchesApi, { type BatchRecord } from "@/axios/batches";
import usersApi from "@/axios/users";
import { useMessage } from "@/components/layout";
import type { RootState } from "@/redux/store";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const TIME_FORMAT = "HH:mm";

function isAdminRole(role: unknown) {
  return role === "admin" || role === "super";
}

function toDayjs(value?: string) {
  if (!value) return undefined;
  const parsed = dayjs(value, TIME_FORMAT, true);
  return parsed.isValid() ? parsed : undefined;
}

function formatTiming(startTime?: string, endTime?: string) {
  const start = toDayjs(startTime);
  const end = toDayjs(endTime);
  if (!start || !end) return "—";
  return `${start.format("h:mm a")} – ${end.format("h:mm a")}`;
}

type BatchPerson = {
  id: string;
  name: string;
  mobileNumber: string;
  uniqueCode: string;
  isActive: boolean;
};

export default function BatchesModule() {
  const router = useRouter();
  const message = useMessage();
  const userData = useSelector((state: RootState) => state.api.userData);
  const allowed = isAdminRole(userData.role);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BatchRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BatchRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<BatchRecord | null>(null);
  const [people, setPeople] = useState<BatchPerson[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleTotal, setPeopleTotal] = useState(0);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await batchesApi.list();
      if (response.success) {
        const rows = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];
        setItems(rows);
      } else {
        message.error(response.error || "Failed to load batches");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [allowed, message]);

  useEffect(() => {
    if (userData.role && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router, userData.role]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openMembers = async (batch: BatchRecord) => {
    setViewing(batch);
    setPeopleLoading(true);
    try {
      const response = await usersApi.listPeople({
        batch: batch.id,
        page: 1,
        pageSize: 100,
      });
      if (response.success) {
        setPeople(response.data?.items || []);
        setPeopleTotal(response.data?.total || 0);
      } else {
        setPeople([]);
        setPeopleTotal(0);
        message.error(response.error || "Failed to load people");
      }
    } catch (error) {
      const err = error as { message?: string };
      setPeople([]);
      setPeopleTotal(0);
      message.error(err.message || "Failed to load people");
    } finally {
      setPeopleLoading(false);
    }
  };

  const openEdit = (batch: BatchRecord) => {
    setEditing(batch);
    form.setFieldsValue({
      name: batch.name,
      sport: batch.sport,
      startTime: toDayjs(batch.startTime),
      endTime: toDayjs(batch.endTime),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      sport: values.sport,
      startTime: (values.startTime as Dayjs).format(TIME_FORMAT),
      endTime: (values.endTime as Dayjs).format(TIME_FORMAT),
    };
    setSaving(true);
    try {
      const response = editing
        ? await batchesApi.update(editing.id, payload)
        : await batchesApi.create(payload);
      if (response.success) {
        message.success(response.message || "Saved");
        setModalOpen(false);
        await load();
      } else {
        message.error(response.error || "Failed to save batch");
      }
    } catch (error) {
      const err = error as { message?: string };
      if (err.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const response = await batchesApi.remove(id);
    if (response.success) {
      message.success("Batch deleted");
      await load();
    } else {
      message.error(response.error || "Failed to delete batch");
    }
  };

  const columns: ColumnsType<BatchRecord> = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (value: string, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={(event) => {
              event.stopPropagation();
              openMembers(record);
            }}
          >
            {value}
          </Button>
        ),
      },
      {
        title: "Sport",
        dataIndex: "sport",
        key: "sport",
        render: (value: string) =>
          value ? value.charAt(0).toUpperCase() + value.slice(1) : "—",
      },
      {
        title: "Timing",
        key: "timing",
        render: (_, record) => formatTiming(record.startTime, record.endTime),
      },
      {
        title: "People",
        dataIndex: "userCount",
        key: "userCount",
        width: 100,
        render: (value: number, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={(event) => {
              event.stopPropagation();
              openMembers(record);
            }}
          >
            {value || 0}
          </Button>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <Space onClick={(event) => event.stopPropagation()}>
            <Button type="link" onClick={() => openEdit(record)}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this batch?"
              description="People must be moved out first."
              onConfirm={() => remove(record.id)}
            >
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Batches
          </Title>
          <Text type="secondary">
            Create and edit batches, including start and end time
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add batch
        </Button>
      </div>

      <Table
        style={{ marginTop: 20 }}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={false}
        onRow={(record) => ({
          onClick: () => openMembers(record),
          style: { cursor: "pointer" },
        })}
      />

      <Modal
        title={editing ? "Edit batch" : "Add batch"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={save}
        confirmLoading={saving}
        okText={editing ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Enter a batch name" }]}
          >
            <Input placeholder="Cricket 1" />
          </Form.Item>
          <Form.Item
            name="sport"
            label="Sport"
            rules={[{ required: true, message: "Select a sport" }]}
          >
            <Select
              placeholder="Sport"
              options={[
                { value: "cricket", label: "Cricket" },
                { value: "tennis", label: "Tennis" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Start time"
            rules={[{ required: true, message: "Select start time" }]}
          >
            <TimePicker
              format="h:mm a"
              use12Hours
              minuteStep={15}
              style={{ width: "100%" }}
              placeholder="Start time"
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="End time"
            dependencies={["startTime"]}
            rules={[
              { required: true, message: "Select end time" },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs | undefined) {
                  const start = getFieldValue("startTime") as Dayjs | undefined;
                  if (!value || !start || value.isAfter(start)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("End time must be after start time")
                  );
                },
              }),
            ]}
          >
            <TimePicker
              format="h:mm a"
              use12Hours
              minuteStep={15}
              style={{ width: "100%" }}
              placeholder="End time"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={viewing?.name || "Batch"}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        width={420}
      >
        {viewing ? (
          <Text type="secondary">
            {formatTiming(viewing.startTime, viewing.endTime)}
            {peopleTotal ? ` · ${peopleTotal} people` : ""}
          </Text>
        ) : null}
        <List
          style={{ marginTop: 16 }}
          loading={peopleLoading}
          locale={{ emptyText: "No people in this batch yet" }}
          dataSource={people}
          renderItem={(person) => (
            <List.Item>
              <List.Item.Meta
                title={person.name || "—"}
                description={
                  <span>
                    {person.uniqueCode}
                    {person.mobileNumber ? ` · ${person.mobileNumber}` : ""}
                  </span>
                }
              />
              {person.isActive ? (
                <Tag color="green">Active</Tag>
              ) : (
                <Tag>Inactive</Tag>
              )}
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
}
