"use client";

import { Typography } from "antd";
import branding from "@/config/branding";

const { Title, Text } = Typography;

export type FamilyNode = {
  id: string;
  name: string;
  uniqueCode: string;
  role: string;
} | null;

export type FamilyTreeData = {
  grandparent: FamilyNode;
  parent: FamilyNode;
  guardian: FamilyNode;
  student: FamilyNode;
  youId: string;
};

function NodeCard({
  node,
  label,
  youId,
}: {
  node: FamilyNode;
  label: string;
  youId: string;
}) {
  const isYou = Boolean(node && node.id === youId);

  return (
    <div
      style={{
        minWidth: 180,
        maxWidth: 220,
        padding: "14px 16px",
        borderRadius: 12,
        background: isYou ? "#f3f7fd" : "#ffffff",
        border: isYou
          ? `2px solid ${branding.primaryColor}`
          : "1px solid #e8e8e8",
        boxShadow: isYou
          ? "0 0 0 4px rgba(27, 79, 156, 0.12)"
          : "0 4px 12px rgba(0, 0, 0, 0.04)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: isYou ? 18 : 12,
            height: isYou ? 18 : 12,
            borderRadius: "50%",
            background: node
              ? isYou
                ? branding.primaryColor
                : branding.primaryColorLight
              : "#d9d9d9",
            boxShadow: isYou
              ? `0 0 0 6px rgba(27, 79, 156, 0.18)`
              : undefined,
            display: "inline-block",
          }}
        />
      </div>
      <Text
        type="secondary"
        style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <div style={{ marginTop: 4, fontWeight: 600, color: "#1f1f1f" }}>
        {node?.name || "Not linked"}
      </div>
      {node?.uniqueCode ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {node.uniqueCode}
        </Text>
      ) : null}
      {isYou ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: 600,
            color: branding.primaryColor,
          }}
        >
          You are here
        </div>
      ) : null}
    </div>
  );
}

function Stem() {
  return (
    <div
      style={{
        width: 2,
        height: 28,
        background: branding.primaryColorLight,
        margin: "0 auto",
      }}
    />
  );
}

export default function FamilyTree({
  tree,
  highlightYou = true,
}: {
  tree: FamilyTreeData;
  highlightYou?: boolean;
}) {
  const youId = highlightYou ? tree.youId : "";
  const caption = highlightYou
    ? "Grandparent → parent → student. Your node is highlighted."
    : "Grandparent → parent → student.";

  return (
    <div style={{ marginTop: highlightYou ? 32 : 0 }}>
      {highlightYou ? (
        <>
          <Title level={4} style={{ marginBottom: 4 }}>
            Family hierarchy
          </Title>
          <Text type="secondary">{caption}</Text>
        </>
      ) : null}

      <div
        style={{
          marginTop: highlightYou ? 24 : 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <NodeCard
          node={tree.grandparent}
          label="Grandparent"
          youId={youId}
        />
        <Stem />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          <NodeCard node={tree.parent} label="Parent" youId={youId} />
          <div
            style={{
              width: 48,
              height: 2,
              background: branding.primaryColorLight,
              margin: "0 8px",
            }}
          />
          <NodeCard
            node={tree.guardian}
            label="Guardian"
            youId={youId}
          />
        </div>
        <Stem />
        <NodeCard node={tree.student} label="Student" youId={youId} />
      </div>
    </div>
  );
}
