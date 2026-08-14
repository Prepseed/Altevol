"use client";

import React, { useLayoutEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Typography } from "antd";
import { updateFooter } from "@/redux/actions/UiActions";

const { Text } = Typography;

export default function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    if (ref.current) {
      dispatch(updateFooter(ref.current.offsetHeight));
    }
  }, [dispatch]);

  return (
    <div
      ref={ref}
      style={{
        padding: "16px 24px",
        textAlign: "center",
        borderTop: "1px solid #f0f0f0",
        background: "#fff",
      }}
    >
      <Text type="secondary" style={{ fontSize: "14px" }}>
        © {new Date().getFullYear()} SRT10 Altevol Centre of Excellence
      </Text>
    </div>
  );
}
