/* eslint-disable @next/next/no-img-element */
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdown 默认不解析原始 HTML（未启用 rehype-raw），
// 因此不会执行内容里的 <script>/onerror 等，天然规避 XSS。
// 注意：不要为了渲染富文本而引入 rehype-raw。
const components: Components = {
  img: ({ src, alt, title }) => (
    <img
      src={src}
      alt={alt ?? ""}
      title={title}
      loading="lazy"
      className="block max-w-full h-auto my-3 mx-auto"
    />
  ),
  a: ({ href, title, children }) => (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600"
    >
      {children}
    </a>
  ),
};

/** Markdown 预览组件，支持 GFM（列表、表格、加粗、链接、图片） */
// 正文样式全部用 Tailwind arbitrary variant 挂在容器上，不额外维护 CSS 文件
export const MarkdownContent = ({ content }: { content: string }) => (
  <div className="text-[15px] leading-[1.8] text-gray-800 break-words [&_p]:mb-3.5 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-sm [&_th]:border [&_th]:border-gray-200 [&_th]:px-2.5 [&_th]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:px-2.5 [&_td]:py-1.5 [&_blockquote]:my-3 [&_blockquote]:py-1 [&_blockquote]:px-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gray-300 [&_blockquote]:text-gray-500">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  </div>
);
