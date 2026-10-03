import Image from "next/image";

import qrCodeImage from "@/assets/whalepea_qrcode.jpg";
import { cn } from "@/utils/cn";

/**
 * 结果页左上角的二维码，直接用 src/assets/whalepea_qrcode.jpg。
 *
 * 源图 258×258，按 258 渲染再缩到 58px 显示，打印时也清晰；
 * 以后要换成动态二维码，替换这张图或改成生成实现即可。
 */
export const QrCode = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-1",
      className,
    )}
  >
    <Image
      src={qrCodeImage}
      alt="鲸鱼擦除君二维码"
      width={258}
      height={258}
      className="h-[58px] w-[58px] rounded"
    />
  </span>
);
