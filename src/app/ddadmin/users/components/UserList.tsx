"use client";

import { useEffect, useState } from "react";
import { Mbutton } from "../../uis";
import { adminRequest } from "../../utils/adminRequest";

interface User {
  openid: string;
  user_name: string;
  createdAt: string;
}

interface UserListResponse {
  status: number;
  data: {
    count: number;
    rows: User[];
  };
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const offset = currentPage * pageSize;
      const res: UserListResponse = await adminRequest(
        `/api/admin/summary/users?offset=${offset}&page=${pageSize}`,
      );

      if (res.status === 200) {
        setUsers(res.data.rows);
        setTotalCount(res.data.count);
      }
    } catch (error) {
      console.error("获取用户列表失败", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">用户列表</h2>
        <div className="text-gray-600">
          共 {totalCount} 个用户，第 {currentPage + 1} 页 / 共 {totalPages} 页
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OpenID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.openid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {user.openid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">暂无用户数据</div>
          )}

          <div className="flex justify-between items-center mt-4">
            {currentPage === 0 ? (
              <div className="opacity-50 cursor-not-allowed mb-4 p-2 bg-blue-500 text-white rounded flex justify-center items-center">
                上一页
              </div>
            ) : (
              <Mbutton
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              >
                上一页
              </Mbutton>
            )}

            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded ${currentPage === pageNum ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            {currentPage >= totalPages - 1 ? (
              <div className="opacity-50 cursor-not-allowed mb-4 p-2 bg-blue-500 text-white rounded flex justify-center items-center">
                下一页
              </div>
            ) : (
              <Mbutton
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
              >
                下一页
              </Mbutton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
