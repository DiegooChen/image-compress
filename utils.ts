// utils.ts - Utility functions for image compression

/**
 * 格式化文件大小为人类可读格式
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 计算压缩比例
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * 验证图片文件类型
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  return validTypes.includes(file.type);
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 验证图片质量值
 */
export function validateQuality(quality: number): boolean {
  return quality >= 0.1 && quality <= 1;
}

/**
 * 验证图片宽度
 */
export function validateMaxWidth(width: number): boolean {
  return width >= 0 && width <= 5000;
}

/**
 * 计算调整后的尺寸
 */
export function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  if (maxWidth <= 0 || originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const ratio = maxWidth / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * 计算进度百分比
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * 验证主题名称
 */
export function isValidTheme(theme: string | null): theme is 'light' | 'dark' {
  return theme === 'light' || theme === 'dark';
}

/**
 * 从localStorage安全获取主题设置
 */
export function getThemeFromStorage(): 'light' | 'dark' {
  const saved = localStorage.getItem('theme');
  return isValidTheme(saved) ? saved : 'light';
}

/**
 * 检查文件是否超过大小限制 (默认10MB)
 */
export function isFileSizeValid(file: File, maxSizeInMB: number = 10): boolean {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * 提取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * 根据MIME类型获取建议的文件扩展名
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif'
  };
  return mimeMap[mimeType] || 'jpg';
}