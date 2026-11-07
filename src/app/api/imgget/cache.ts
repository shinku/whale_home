export const MAX_IMAGE_CACHE_ENTRIES = 100;

export type TCachedImage = {
  data: ArrayBuffer;
  contentType: string;
};

const imageCache = new Map<string, TCachedImage>();

/** 读取并刷新 LRU 顺序。 */
export const getCachedImage = (url: string) => {
  const cached = imageCache.get(url);
  if (!cached) return undefined;

  imageCache.delete(url);
  imageCache.set(url, cached);
  return cached;
};

/** 写入缓存，超过 100 个地址时淘汰最久未使用的图片。 */
export const setCachedImage = (url: string, image: TCachedImage) => {
  imageCache.delete(url);
  imageCache.set(url, image);

  while (imageCache.size > MAX_IMAGE_CACHE_ENTRIES) {
    const oldestKey = imageCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    imageCache.delete(oldestKey);
  }
};

export const clearImageCache = () => {
  imageCache.clear();
};
