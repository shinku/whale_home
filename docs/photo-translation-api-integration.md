# AI 图片翻译前端集成文档

## 1. 流程概览

拍照翻译采用和其他学科一致的“生成 → 跳结果页 → 按 id 查询”流程：

```text
选择图片
  → 用 Canvas 固定重画为 800px 宽，高度等比例自适应
  → POST /api/ai/subject/translate
  → 返回 UUID id
  → 浏览器跳 /subjects/translate/detail?id=<id>
  → 小程序跳既有 subject-detail-page，并通过 requestid 透传 <id>
  → 结果页 GET /api/ai/subject/translate/<id>
  → source 为远程地址时经 /api/imgget 代理下载
  → 用下载后的 source 和 result 绘制 Canvas
```

小程序既有结果页只识别 `requestid`，所以前端继续调用
`jumnToMiniProgramSubjectDetail`，把翻译接口返回的 `id` 放进 `requestid`
参数。Next 结果页同时兼容：

```text
?id=<id>
?requestid=<id>
```

## 2. 生成接口

```http
POST /api/ai/subject/translate
Content-Type: application/json
x-user-id: <openid>
```

请求：

```json
{
  "source": "data:image/png;base64,iVBORw0KGgo...",
  "direction": "en_to_zh"
}
```

| 字段 | 要求 |
| --- | --- |
| `source` | 必填，单张图片 Data URL 或裸 Base64，解码后最大 10MB |
| `direction` | 翻译方向：`en_to_zh`（英译中）或 `zh_to_en`（中译英），默认 `en_to_zh` |
| `imageBase64` | 兼容旧字段 |
| `image` | 兼容旧字段 |

不支持：

- `multipart/form-data` 文件上传。
- 公网图片 URL。
- 多张图片。
- 解码后超过 10MB 的图片。

接口受后端 `VipCheckMiddleware` 校验，VIP 校验开启时必须有有效会员身份。
前端只调用同源 Next 路由，由 Next 转发 `x-user-id`，不能在浏览器使用
`QWEN_APP_KEY`。

页面使用 Ant Design `Select` 选择翻译方向：

| 展示文案 | 提交值 |
| --- | --- |
| 英译中 | `en_to_zh` |
| 中译英 | `zh_to_en` |

默认选中“英译中”。

## 3. 生成响应

```json
{
  "status": 200,
  "data": {
    "source": "data:image/png;base64,iVBORw0KGgo...",
    "result": [
      {
        "message": "这是一段翻译",
        "rect": {
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 20
        },
        "color": "#ffffff",
        "background": "#1e1e1e",
        "fontSize": 24
      }
    ],
    "direction": "en_to_zh",
    "imageWidth": 1920,
    "imageHeight": 1080
  },
  "id": "b4f0ea74-..."
}
```

| 字段 | 说明 |
| --- | --- |
| `data.source` | 800px 宽图片的 Base64，或未带域名的 OSS 对象路径 |
| `data.result` | 翻译文字块 |
| `data.direction` | 翻译方向 |
| `data.imageWidth` | 后端解析文字时使用的图片宽度 |
| `data.imageHeight` | 后端解析文字时使用的图片高度 |
| `id` | UUID，用于结果页查询 |

服务端会把 `{ source, result }` 写入 `ai_subject_store`，有效期 24 小时。

如果 `data.source` 是不带域名的对象路径，例如：

```text
pub/ai-translate/translate_1794057015385_example.png
```

Next 服务端会统一补全为：

```text
https://fms.whalepea.com/pub/ai-translate/translate_1794057015385_example.png
```

域名常量位于：

```text
src/app/subjects/translate/types.ts
```

## 4. 结果查询接口

```http
GET /api/ai/subject/translate/<id>
x-user-id: <openid>
```

成功响应与生成接口相同：

```json
{
  "status": 200,
  "data": {
    "source": "data:image/png;base64,iVBORw0KGgo...",
    "result": []
  },
  "id": "b4f0ea74-..."
}
```

错误：

| 状态 | 场景 |
| --- | --- |
| `404` | 结果不存在 |
| `410` | 结果超过 24 小时 |

## 5. 图片上传前处理

上传前不能直接把原始大图发给接口，而是先用 Canvas 固定重画为 800px 宽：

```ts
const size = calculateImageSize({
  naturalWidth: image.naturalWidth,
  naturalHeight: image.naturalHeight,
  targetWidth: 800,
});

canvas.width = size.width;
canvas.height = size.height;
ctx.drawImage(image, 0, 0, size.width, size.height);

const dataUrl = canvas.toDataURL(outputType, 0.9);
```

实现文件：

```text
src/app/subjects/translate/image.ts
```

规则：

- Canvas 宽度固定为 `800px`，小图也统一缩放到该宽度。
- 高度按原图比例自动计算。
- PNG 保持 PNG；其他图片输出 JPEG，质量 `0.9`。
- 后端返回的 `rect` 坐标基于这张 800px 宽的图片。

没有图片时，“生成内容”按钮必须保持禁用。

## 6. 生成后的跳转

浏览器：

```ts
params.delete("requestid");
params.set("id", body.id);
router.push(`/subjects/translate/detail?${params.toString()}`);
```

小程序 WebView：

```ts
jumnToMiniProgramSubjectDetail(
  "translate",
  body.id,
  userId,
  showExport,
);
```

这里的 `body.id` 会作为小程序结果页的 `requestid` 参数继续向下传递，
最终 Next 结果页从 `requestid` 中读出真实翻译结果 id。

## 7. 结果页绘制

结果页：

```text
/subjects/translate/detail?id=<id>
```

相关文件：

```text
src/app/subjects/translate/detail/page.tsx
src/app/subjects/components/TranslateCanvas.tsx
src/app/subjects/translate/service.ts
```

页面通过 `getTranslateResultById` 直接请求后端，取得：

- `source`：原始图片 Base64 或远程图片地址。
- `result`：文字块数组。

对象路径在 Next 服务端先补全 `https://fms.whalepea.com/` 域名。
如果补全后的 `source` 是 `https://` 远程地址，结果页不能直接把它交给 Canvas
访问，而是改为：

```ts
`/api/imgget?url=${encodeURIComponent(source)}`
```

Data URL 和裸 Base64 仍直接使用，不经过图片代理。

`TranslateCanvas` 使用 `imageWidth / imageHeight` 作为解析坐标系：

```ts
const height = Math.round((imageHeight * 800) / imageWidth);
canvas.width = 800;
canvas.height = height;

const scale = Math.min(
  canvas.width / imageWidth,
  canvas.height / imageHeight,
);
const offsetX = (canvas.width - imageWidth * scale) / 2;
const offsetY = (canvas.height - imageHeight * scale) / 2;

ctx.drawImage(
  source,
  offsetX,
  offsetY,
  imageWidth * scale,
  imageHeight * scale,
);
```

接口返回的 `rect` 使用 `imageWidth / imageHeight` 坐标系。绘制时统一转换：

```ts
x = offsetX + rect.x * scale;
y = offsetY + rect.y * scale;
w = rect.w * scale;
h = rect.h * scale;
fontSize = block.fontSize * scale;

ctx.fillStyle = background;
ctx.fillRect(x, y, w, h);

ctx.fillStyle = color;
ctx.font = `600 ${fontSize}px sans-serif`;
ctx.fillText(message, x + padding, y + padding);
```

绘制规则：

- 按 `rect.x / y / w / h` 绘制接口返回的 `background`。
- 严格使用接口返回的 `color` 绘制译文，不再根据明暗自动改写颜色。
- 使用接口返回的 `fontSize` 作为绘制字号。
- 非法背景色回退为 `#ffffff`。
- 非法颜色回退为 `#333333`。
- `fontSize` 缺失或非法时按矩形高度回退字号。
- 自动换行，超出矩形的文字被裁剪。
- 绘制完成后将 Canvas 转为 Base64，并通过页面 `<img>` 展示。
- 绘制前后 Canvas 宽度始终为 800px。
- `rect` 和 `fontSize` 使用相同的 `scale` 与 `offset`，保证文字相对位置不变。

## 7.1 图片代理与缓存

图片代理：

```http
GET /api/imgget?url=https://fms.whalepea.com/pub/ai-translate/example.png
```

也兼容：

```http
POST /api/imgget
Content-Type: application/json

{
  "url": "https://fms.whalepea.com/pub/ai-translate/example.png"
}
```

代理规则：

- 只允许 HTTPS 的 `fms.whalepea.com` 或其他 `*.whalepea.com` 地址。
- 服务端下载图片后直接返回图片二进制和原始 Content-Type。
- 远端不是图片时返回 `502`。
- 图片最大 20MB，下载超时 30 秒。
- 同一图片 URL 在 Next 服务端做内存缓存。
- 缓存采用 LRU，最多保留最近使用的 100 个图片地址。
- 浏览器响应额外设置 1 天 `Cache-Control`。

## 8. 错误处理

```ts
const response = await fetch("/api/ai/subject/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(userId ? { "x-user-id": userId } : {}),
  },
  body: JSON.stringify({
    source: image,
    direction, // en_to_zh | zh_to_en
  }),
});

const body = await response.json();

if (
  !response.ok ||
  body.status !== 200 ||
  !body.id ||
  !Array.isArray(body.data?.result)
) {
  throw new Error(
    body.error || body.message || "图片翻译失败，请稍后重试",
  );
}
```

常见错误：

| 场景 | 状态 | 前端处理 |
| --- | --- | --- |
| 没有图片 | - | 按钮禁用 |
| 非 Base64 / 公网 URL | 400 | 展示接口错误 |
| 超过 10MB | 413 | 提示压缩图片 |
| 非会员 | 401 / 403 | 展示会员提示 |
| Qwen 失败 | 500 / 502 | 提示稍后重试 |
| 结果不存在 | 404 | 结果页显示不存在 |
| 结果过期 | 410 | 结果页提示重新上传 |

## 9. 联调检查

1. 不上传图片时，生成按钮禁用。
2. 上传图片后，检查 Network 请求体是 `source`。
3. 检查上传图片宽度不超过当前表单容器宽度，高度比例正确。
4. 生成成功响应必须包含 `data.source`、`data.result` 和 `id`。
5. 浏览器跳转 URL 使用 `?id=<id>`。
6. 小程序跳转后，Next 结果页能从 `requestid` 取到同一个 id。
7. 结果页按 id 请求成功，`source` 能正常加载。
8. `rect` 与图片文字位置一致，译文没有越界。
