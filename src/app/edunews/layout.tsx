import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教育新闻",
  description: "最新教育新闻",
};

export default function EduNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 box-border">{children}</div>
  );
}
