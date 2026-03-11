import "./globals.css";

export const metadata = {
  title: "Alpha World",
  description: "Open world business MVP built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

