# 项目约定

## 测试文件统一放在 `src/tests/`

- 所有测试文件（`*.test.ts` / `*.test.tsx`）**必须**放在 `src/tests/` 目录下，不允许与被测源码并排存放（不要写 `src/app/**/route.test.ts`）。
- `src/tests/` 的目录结构镜像 `src/` 的源码结构，动态路由段去掉方括号：
  - `src/app/api/[...slug]/route.ts` → `src/tests/app/api/slug/route.test.ts`
- 测试文件命名为 `<被测文件名>.test.ts`（例如被测的 `route.ts` 对应 `route.test.ts`）。
- 在测试中用 `@/` 别名引用被测模块，避免脆弱的相对路径：
  - `import { handleRequest } from "@/app/api/[...slug]/route";`
- 测试框架为 **Jest**（通过 Next 官方的 `next/jest` 接入 SWC），配置在 `jest.config.js`：
  - `testMatch` 固定为 `src/tests/**/*.test.ts`，新增测试目录时无需改动配置。
  - 全局 mock（例如固定 `getApiHost`）写在 `src/tests/setup.ts`，通过 `setupFiles` 生效。
  - `next/jest` 的 SWC 会改写 `@/*` 别名且不做 `jest.mock` 提升，需要全局 mock 时请放进 `setupFiles`，不要依赖测试文件里的 `jest.mock`。
- 运行方式：`npm test`（单次执行）/ `npm run test:watch`（监听模式）。

## Mock 一律写在单元测试里，不要动底层文件

- 需要 mock 外部依赖（上游接口、`getApiHost`、环境变量、随机性、时间等）时，**只能**用 Jest 的 mock：全局 mock 放 `src/tests/setup.ts`（`setupFiles`），用例级 mock 放 `src/tests/**/*.test.ts`。
- **禁止**为了调试、自测或联调去改源码 / 配置 / 底层文件来造 mock，例如：临时改 `getApiHost` 指向、改 `src/app/api/**` 路由逻辑、加临时开关或环境变量分支、注释掉真实调用等。这些改动会混进 review，一律不要做。
- **禁止**在本地起独立的常驻进程 / 服务 / 代理（包括写在 `/private/tmp`、`/tmp` 等任何位置的 mock 服务）来改变运行时行为。尤其不能占用或替换 `getApiHost()` 指向的端口（开发环境是 `127.0.0.1:7001`）：它会遮蔽真实后端，让页面拿到错误数据，属于严重事故。
- 如果确实万不得已要起这类临时进程，必须**在同一轮内**用完即关，并在本轮结束前确认进程和端口都已释放（例如 `lsof -nP -i :<port>` 无输出、`lsof -p <pid>` 查不到）。绝不允许留到下一轮，也绝不允许交给用户去收尾。起之前先确认本轮能关掉它——本环境沙箱禁止向进程发送信号（`kill` / `os.kill` 均为 EPERM），一旦起了很可能就杀不掉。
- 确实需要在真实页面里验证时，验证用的临时改动（文件、服务、进程、配置）必须在结束前全部还原 / 清理干净，不得残留在工作区。
- 收尾前用 `git status` / `git diff` 自查一遍，确保只留下本次任务真正需要的改动，没有与任务无关的调试痕迹。

## 样式统一使用 Tailwind CSS

- 所有样式**必须**通过 Tailwind CSS 的 utility class 实现；新代码不要再新增自定义 CSS 文件，也不要 `import "./xxx.css"`。
- 不要在组件里写 `style={{ ... }}` 内联样式，改用 Tailwind（需要精确值时用 arbitrary value，例如 `text-[15px]`、`leading-[1.8]`、`border-l-[3px]`）。
- 颜色优先用 Tailwind 标准色阶（`text-gray-400`、`border-gray-200`、`text-blue-600`…），必要时才用 arbitrary value（如 `bg-[#f0f4ff]`）。
- 给 Markdown 等第三方渲染出的 HTML 加样式时，用 arbitrary variant 把规则挂在容器上，不要写 CSS 文件：
  - 例：`[&_p]:mb-3.5 [&_img]:max-w-full [&_blockquote]:border-l-[3px]`
- 全局样式只保留 `src/app/globals.css`，其中只放 `@import "tailwindcss";` 和 CSS 变量。

## 通用代理路由约定

- `src/app/api/[...slug]/route.ts` 是所有 `/api/xxxx` 请求的通用代理，转发到 `getApiHost() + "api/" + slug.join("/")`。
- 只有首段在 `src/app/api/[...slug]/lisence.ts` 的 `lisencedPaths` 白名单内的路径才会被转发，其余一律返回 `403 { error: "Unauthorized path" }`。新增可代理的路径前缀时，改这个白名单并补测试。
