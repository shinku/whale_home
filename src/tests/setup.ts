import { jest } from "@jest/globals";

// 在测试文件被加载之前注册 mock，保证顺序（next/jest 的 SWC 不做 jest.mock 提升）。
// 注意：SWC 会把 tsconfig 的 "@/*" 别名改写成相对路径，但 Jest 是按解析后的
// 绝对路径匹配 mock 的，所以这里写 "@/utils" 依然能命中。
jest.mock("@/utils", () => ({
  getApiHost: () => "https://api.example.test/",
}));

// @ant-design/icons 6.x 内部依赖 ESM 包，测试中不校验图标渲染，统一替换为空组件。
jest.mock("@ant-design/icons", () => {
  const Icon = () => null;
  return new Proxy(
    { __esModule: true },
    {
      get(target, property) {
        if (property === "__esModule") return true;
        return Icon;
      },
    },
  );
});
