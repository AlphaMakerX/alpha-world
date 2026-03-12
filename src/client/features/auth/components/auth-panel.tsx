"use client";

import { Button, Card, Form, Input, Space, Tabs, Typography, message } from "antd";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/client/lib/trpc";

type AuthForm = {
  username: string;
  password: string;
};

export function AuthPanel() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [loginLoading, setLoginLoading] = useState(false);
  const registerMutation = trpc.auth.register.useMutation();

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
      router.push("/");
      router.refresh();
    } finally {
      setLoginLoading(false);
    }
  };

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
      <main className="mx-auto flex min-h-screen max-w-xl items-center p-8">
        {contextHolder}
        <Card className="w-full">
          <Space orientation="vertical" size={12}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              已登录
            </Typography.Title>
            <Typography.Text>当前用户：{session.user?.name}</Typography.Text>
            <Button type="primary" onClick={() => router.push("/")}>
              返回首页
            </Button>
          </Space>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-8">
      {contextHolder}
      <Card className="w-full">
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
                  <Form<AuthForm>
                    layout="vertical"
                    onFinish={(values) => void onRegister(values)}
                  >
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
      </Card>
    </main>
  );
}
