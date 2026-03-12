"use client";

import { Button, Card, Space, Typography } from "antd";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/lib/trpc";

export function HomeClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data, isLoading, refetch } = trpc.hello.useQuery({
    name: session?.user?.name ?? "Builder",
  });

  return (
    <Card>
      <Space orientation="vertical" size={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          集成验证
        </Typography.Title>
        <Typography.Text type="secondary">
          下面内容来自 tRPC 查询，按钮来自 Ant Design，布局由 Tailwind 控制。
        </Typography.Text>
        <Typography.Text>{isLoading ? "加载中..." : data?.message}</Typography.Text>
        {status === "authenticated" ? (
          <>
            <Typography.Text>当前用户：{session.user?.name}</Typography.Text>
            <Space>
              <Button type="primary" onClick={() => void refetch()}>
                重新请求 tRPC
              </Button>
              <Button onClick={() => void signOut({ callbackUrl: "/" })}>退出登录</Button>
            </Space>
          </>
        ) : (
          <Space>
            <Button type="primary" onClick={() => router.push("/login")}>
              去登录 / 注册
            </Button>
            <Button onClick={() => void refetch()}>匿名请求 tRPC</Button>
          </Space>
        )}
      </Space>
    </Card>
  );
}
