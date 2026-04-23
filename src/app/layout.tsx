/**
 * 应用根布局文件
 * 定义全局 HTML 结构、元数据，以及顶层 Provider 的挂载（Ant Design 样式注册、全局状态提供者）。
 */

import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppProviders } from "@/client/lib/app-providers";
import "./globals.css";

/** 页面元数据：标题和描述，用于 SEO 和浏览器标签显示 */
export const metadata: Metadata = {
  title: "Alpha World",
  description: "Alpha World game app",
};

/**
 * 根布局组件
 * 包裹 AntdRegistry（Ant Design 服务端样式注入）和 AppProviders（tRPC、React Query、Session 等全局 Provider）。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
