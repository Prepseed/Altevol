"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Typography,
} from "antd";
import { ArrowLeftOutlined, FormOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useMessage } from "@/components/layout";
import entryFormApi from "@/axios/entryForm";
import branding from "@/config/branding";

const { Text, Title } = Typography;
const { TextArea } = Input;

type EntryFormValues = {
  name: string;
  mobileNumber: string;
  email: string;
  howDidYouKnowAboutUs:
    | "google"
    | "instagram"
    | "facebook"
    | "youtube"
    | "friend_family"
    | "hoarding"
    | "website"
    | "walk_in"
    | "other";
  howDidYouKnowOther?: string;
  visitedBefore: boolean;
  knownPersonHere: boolean;
  knownPersonName?: string;
  sport: "cricket" | "tennis";
  playerLevel?: "beginner" | "intermediate" | "competitive";
  age?: number;
  preferredVisitDate?: { toISOString: () => string };
  message?: string;
};

const heardFromOptions = [
  { value: "google", label: "Google / Search" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "friend_family", label: "Friend / Family" },
  { value: "hoarding", label: "Hoarding / Banner" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

export default function EntryForm() {
  const [form] = Form.useForm<EntryFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const message = useMessage();
  const heardFrom = Form.useWatch("howDidYouKnowAboutUs", form);
  const knownPersonHere = Form.useWatch("knownPersonHere", form);

  const onFinish = async (values: EntryFormValues) => {
    setSubmitting(true);
    try {
      const response = await entryFormApi.submit({
        name: values.name,
        mobileNumber: values.mobileNumber,
        email: values.email,
        howDidYouKnowAboutUs: values.howDidYouKnowAboutUs,
        howDidYouKnowOther: values.howDidYouKnowOther,
        visitedBefore: values.visitedBefore,
        knownPersonHere: values.knownPersonHere,
        knownPersonName: values.knownPersonName,
        sport: values.sport,
        playerLevel: values.playerLevel,
        age: values.age,
        preferredVisitDate: values.preferredVisitDate?.toISOString(),
        message: values.message,
      });

      if (response.success) {
        message.success("Thank you. Your entry form has been submitted.");
        form.resetFields();
        router.push("/");
      } else {
        message.error(response.error || "Failed to submit entry form");
      }
    } catch (error) {
      const err = error as { message?: string };
      message.error(err.message || "Failed to submit entry form");
    } finally {
      setSubmitting(false);
    }
  };

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
      <Card
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 16,
          border: "none",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <img
            src={branding.logo}
            alt={branding.brandName}
            style={{
              width: 220,
              maxWidth: "80%",
              height: "auto",
              objectFit: "contain",
              display: "block",
              margin: "0 auto 16px",
            }}
          />
          <Title level={4} style={{ marginBottom: 4 }}>
            Entry Form
          </Title>
          <Text type="secondary">
            Fill this form to register your visit.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mobileNumber"
                label="Mobile Number"
                rules={[
                  { required: true, message: "Please enter mobile number" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Enter a valid 10-digit mobile number",
                    transform: (value) => value?.replace(/[+\s-]/g, ""),
                  },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  onChange={(e) => {
                    form.setFieldsValue({
                      mobileNumber: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="howDidYouKnowAboutUs"
            label="How did you get to know about us?"
            rules={[{ required: true, message: "Please select an option" }]}
          >
            <Select placeholder="Select an option" options={heardFromOptions} />
          </Form.Item>

          {heardFrom === "other" && (
            <Form.Item
              name="howDidYouKnowOther"
              label="Please specify"
              rules={[{ required: true, message: "Please tell us how you heard about us" }]}
            >
              <Input placeholder="How did you hear about us?" />
            </Form.Item>
          )}

          <Form.Item
            name="visitedBefore"
            label="Have you visited before?"
            rules={[{ required: true, message: "Please select yes or no" }]}
          >
            <Radio.Group
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="knownPersonHere"
            label="Any known person here?"
            rules={[{ required: true, message: "Please select yes or no" }]}
          >
            <Radio.Group
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          </Form.Item>

          {knownPersonHere && (
            <Form.Item
              name="knownPersonName"
              label="Known person's name"
              rules={[{ required: true, message: "Please enter their name" }]}
            >
              <Input placeholder="Name of the person you know here" />
            </Form.Item>
          )}

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sport"
                label="Sport"
                rules={[{ required: true, message: "Please select a sport" }]}
              >
                <Select
                  placeholder="Select sport"
                  options={[
                    { value: "cricket", label: "Cricket" },
                    { value: "tennis", label: "Tennis" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="playerLevel" label="Player Level">
                <Select
                  allowClear
                  placeholder="Select level"
                  options={[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "competitive", label: "Competitive" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="age" label="Age">
                <InputNumber min={3} max={80} style={{ width: "100%" }} placeholder="Age" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preferredVisitDate" label="Preferred Visit Date">
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="message" label="Message">
            <TextArea rows={3} placeholder="Tell us about your training goals" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              style={{
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColorDark})`,
                border: "none",
                fontWeight: 600,
              }}
            >
              {!submitting && <FormOutlined style={{ marginRight: 8 }} />}
              Submit
            </Button>
          </Form.Item>

          <Button
            type="link"
            block
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/")}
            style={{ color: branding.primaryColor }}
          >
            Back to login
          </Button>
        </Form>
      </Card>
    </div>
  );
}
