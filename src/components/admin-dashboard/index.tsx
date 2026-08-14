"use client";

import { useEffect, useMemo, useState } from "react";
import { Col, Row, Spin, Typography } from "antd";
import usersApi from "@/axios/users";
import { useMessage } from "@/components/layout";
import branding from "@/config/branding";

const { Title, Text } = Typography;

type BatchSlice = {
  id: string;
  name: string;
  sport: string;
  count: number;
};

type DashboardStats = {
  checkIns: number;
  todayCheckIns: number;
  entries: number;
  people: number;
  unassigned: number;
  batches: BatchSlice[];
};

const PIE_COLORS = [
  branding.primaryColor,
  branding.primaryColorLight,
  "#138808",
  "#73d13d",
  "#faad14",
  "#722ed1",
  "#13c2c2",
];
const UNASSIGNED_COLOR = "#bfbfbf";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #f0f0f0",
        borderRadius: 12,
        padding: "20px 22px",
        height: "100%",
      }}
    >
      <Text type="secondary">{label}</Text>
      <Title level={2} style={{ margin: "8px 0 0" }}>
        {value}
      </Title>
      {hint ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

function PieChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const size = 220;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!total) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text type="secondary">No players yet</Text>
      </div>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const circle = (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={36}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
      </g>
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        fill="#333"
        fontSize="28"
        fontWeight="600"
      >
        {total}
      </text>
      <text x="50%" y="60%" textAnchor="middle" fill="#999" fontSize="13">
        players
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await usersApi.dashboardStats();
        if (!active) return;
        if (response.success) {
          setStats(response.data);
        } else {
          message.error(response.error || "Failed to load dashboard");
        }
      } catch (error) {
        if (!active) return;
        const err = error as { message?: string };
        message.error(err.message || "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [message]);

  const pieSlices = useMemo(() => {
    if (!stats) return [];
    const slices = stats.batches.map((batch, index) => ({
      label: batch.name,
      value: batch.count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
    if (stats.unassigned > 0) {
      slices.push({
        label: "Unassigned",
        value: stats.unassigned,
        color: UNASSIGNED_COLOR,
      });
    }
    return slices.filter((slice) => slice.value > 0);
  }, [stats]);

  if (loading) {
    return (
      <div style={{ marginTop: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard
            label="Check-ins"
            value={stats.checkIns}
            hint="Till date"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Today"
            value={stats.todayCheckIns}
            hint="Checked in today"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Entry forms"
            value={stats.entries}
            hint="Walk-in entries"
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Players"
            value={stats.people}
            hint="Role user"
          />
        </Col>
      </Row>

      <div
        style={{
          marginTop: 16,
          background: "#ffffff",
          border: "1px solid #f0f0f0",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <Title level={4} style={{ marginBottom: 4 }}>
          Batch split
        </Title>
        <Text type="secondary">How many players are in each batch</Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 32,
            marginTop: 20,
          }}
        >
          <PieChart slices={pieSlices} />
          <div style={{ flex: 1, minWidth: 220 }}>
            {(stats.batches.length
              ? [
                  ...stats.batches.map((batch, index) => ({
                    label: batch.name,
                    value: batch.count,
                    color: PIE_COLORS[index % PIE_COLORS.length],
                  })),
                  ...(stats.unassigned
                    ? [
                        {
                          label: "Unassigned",
                          value: stats.unassigned,
                          color: UNASSIGNED_COLOR,
                        },
                      ]
                    : []),
                ]
              : pieSlices
            ).map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 10,
                      background: item.color,
                      display: "inline-block",
                    }}
                  />
                  <Text>{item.label}</Text>
                </span>
                <Text strong>{item.value}</Text>
              </div>
            ))}
            {!stats.batches.length && !stats.unassigned ? (
              <Text type="secondary">No batches yet</Text>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
