/**
 * 认证面板组件
 * 提供用户登录和注册功能，包含登录/注册表单切换的 Tab 页。
 * 已登录时显示当前用户信息。
 */

"use client";

import { Button, Form, Input, Space, Tabs, Typography, message } from "antd";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/client/lib/trpc";

/** 登录/注册表单的数据结构 */
type AuthForm = {
  username: string;
  password: string;
};

/** 认证面板组件的 Props */
type AuthPanelProps = {
  /** 认证成功后的回调函数 */
  onAuthSuccess?: () => void;
};

/** 认证面板组件，支持登录和注册两种模式 */
export function AuthPanel({ onAuthSuccess }: AuthPanelProps = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [loginLoading, setLoginLoading] = useState(false);
  const registerMutation = trpc.auth.register.useMutation();

  /** 登录处理：使用 NextAuth credentials 方式登录，成功后刷新路由 */
  const onLogin = async (values: AuthForm) => {
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      });

      if (!result || result.error) {
        messageApi.error("登录失败，请检查用户名或密码");
        return;
      }

      messageApi.success("登录成功");
      onAuthSuccess?.();
      router.refresh();
    } finally {
      setLoginLoading(false);
    }
  };

  /** 注册处理：调用注册接口后自动登录 */
  const onRegister = async (values: AuthForm) => {
    try {
      await registerMutation.mutateAsync(values);

      messageApi.success("注册成功，正在自动登录");
      await onLogin(values);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "注册失败");
    }
  };

  if (status === "authenticated") {
    return (
      <div>
        {contextHolder}
        <Space orientation="vertical" size={12} className="w-full">
          <Typography.Title level={4} style={{ margin: 0 }}>
            已登录
          </Typography.Title>
          <Typography.Text>当前用户：{session.user?.name}</Typography.Text>
        </Space>
      </div>
    );
  }

  return (
    <div className="w-full">
      {contextHolder}
      <Space orientation="vertical" size={16} className="w-full">
        <Typography.Title level={3} style={{ margin: 0 }}>
          登录 / 注册
        </Typography.Title>
        <Tabs
          items={[
            {
              key: "login",
              label: "登录",
              children: (
                <Form<AuthForm> layout="vertical" onFinish={(values) => void onLogin(values)}>
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: "请输入用户名" },
                      { min: 3, message: "用户名至少 3 位" },
                    ]}
                  >
                    <Input placeholder="请输入用户名" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 6, message: "密码至少 6 位" },
                    ]}
                  >
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loginLoading} block>
                    登录
                  </Button>
                </Form>
              ),
            },
            {
              key: "register",
              label: "注册",
              children: (
                <Form<AuthForm> layout="vertical" onFinish={(values) => void onRegister(values)}>
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: "请输入用户名" },
                      { min: 3, message: "用户名至少 3 位" },
                    ]}
                  >
                    <Input placeholder="请输入用户名" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 6, message: "密码至少 6 位" },
                    ]}
                  >
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={registerMutation.isPending}
                    block
                  >
                    注册并登录
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Space>
    </div>
  );
}
