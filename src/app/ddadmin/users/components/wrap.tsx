"use client";

import { useState } from "react";
import UserList from "./UserList";
import UserRecords from "./UserRecords";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "records">("users");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">用户管理</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium text-sm ${activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          用户列表
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2 font-medium text-sm ${activeTab === "records" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          用户使用记录
        </button>
      </div>

      {activeTab === "users" ? <UserList /> : <UserRecords />}
    </div>
  );
}
