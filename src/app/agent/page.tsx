import type { Metadata } from "next";
import { headers } from "next/headers";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import { LearningAgentPage } from "./components/LearningAgentPage";

export const metadata: Metadata = {
  title: "AI 学习助手",
  description: "面向小学到高中的 AI 学习辅导、计划、出题与答案核验助手。",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

export default async function AgentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const openid =
    requestHeaders.get("x-openid")?.trim() ||
    requestHeaders.get("x-user-id")?.trim() ||
    firstValue(params.openid) ||
    firstValue(params.userId) ||
    "";

  return <LearningAgentPage openid={openid} />;
}
