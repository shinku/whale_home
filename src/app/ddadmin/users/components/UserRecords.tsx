"use client";

import { useEffect, useState } from "react";
import { Mbutton } from "../../uis";
import { adminRequest } from "../../utils/adminRequest";

interface UserRecord {
  record_count: number;
  openid: string;
  u_name: string;
  last_used: string;
  first_used: string;
}

interface UserRecordsResponse {
  status: number;
  data: UserRecord[];
}

export default function UserRecords() {
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchRecords();
  }, [currentPage]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const offset = currentPage * pageSize;
      const res: UserRecordsResponse = await adminRequest(
        `/api/admin/summary/users_record?offset=${offset}&page=${pageSize}`,
      );

      if (res.status === 200) {
        setRecords(res.data);
      }
    } catch (error) {
      console.error("获取用户使用记录失败", error);
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

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">用户使用记录</h2>
        <div className="text-gray-600">第 {currentPage + 1} 页</div>
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
                    使用记录数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    第一次使用时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后一次使用时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr
                    key={`${record.openid}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {record.openid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.u_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">
                        {record.record_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.first_used)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.last_used)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              暂无用户使用记录
            </div>
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

            <div className="text-gray-600">第 {currentPage + 1} 页</div>

            {records.length < pageSize ? (
              <div className="opacity-50 cursor-not-allowed mb-4 p-2 bg-blue-500 text-white rounded flex justify-center items-center">
                下一页
              </div>
            ) : (
              <Mbutton onClick={() => setCurrentPage((prev) => prev + 1)}>
                下一页
              </Mbutton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
