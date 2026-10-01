import { jest } from "@jest/globals";

// 在测试文件被加载之前注册 mock，保证顺序（next/jest 的 SWC 不做 jest.mock 提升）。
// 注意：SWC 会把 tsconfig 的 "@/*" 别名改写成相对路径，但 Jest 是按解析后的
// 绝对路径匹配 mock 的，所以这里写 "@/utils" 依然能命中。
jest.mock("@/utils", () => ({
  getApiHost: () => "https://api.example.test/",
}));
