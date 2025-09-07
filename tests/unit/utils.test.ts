// utils.test.ts - Unit tests for utility functions

import {
  formatFileSize,
  calculateCompressionRatio,
  isValidImageType,
  generateId,
  validateQuality,
  validateMaxWidth,
  calculateResizedDimensions,
  calculateProgress,
  isValidTheme,
  getThemeFromStorage,
  isFileSizeValid,
  getFileExtension,
  getExtensionFromMimeType
} from '../../utils';

describe('formatFileSize', () => {
  test('应该格式化字节为人类可读格式', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  test('应该处理小数位', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024 + 512 * 1024)).toBe('1.5 MB');
  });
});

describe('calculateCompressionRatio', () => {
  test('应该正确计算压缩比例', () => {
    expect(calculateCompressionRatio(1000, 500)).toBe(50);
    expect(calculateCompressionRatio(1000, 750)).toBe(25);
    expect(calculateCompressionRatio(1000, 1000)).toBe(0);
  });

  test('应该处理原始大小为0的情况', () => {
    expect(calculateCompressionRatio(0, 100)).toBe(0);
  });

  test('应该处理压缩后更大的情况', () => {
    expect(calculateCompressionRatio(500, 1000)).toBe(-100);
  });
});

describe('isValidImageType', () => {
  test('应该验证有效的图片类型', () => {
    const validFile1 = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const validFile2 = new File([''], 'test.png', { type: 'image/png' });
    const validFile3 = new File([''], 'test.webp', { type: 'image/webp' });
    
    expect(isValidImageType(validFile1)).toBe(true);
    expect(isValidImageType(validFile2)).toBe(true);
    expect(isValidImageType(validFile3)).toBe(true);
  });

  test('应该拒绝无效的文件类型', () => {
    const invalidFile1 = new File([''], 'test.txt', { type: 'text/plain' });
    const invalidFile2 = new File([''], 'test.pdf', { type: 'application/pdf' });
    
    expect(isValidImageType(invalidFile1)).toBe(false);
    expect(isValidImageType(invalidFile2)).toBe(false);
  });
});

describe('generateId', () => {
  test('应该生成唯一ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });
});

describe('validateQuality', () => {
  test('应该验证有效的质量值', () => {
    expect(validateQuality(0.1)).toBe(true);
    expect(validateQuality(0.5)).toBe(true);
    expect(validateQuality(1)).toBe(true);
  });

  test('应该拒绝无效的质量值', () => {
    expect(validateQuality(0)).toBe(false);
    expect(validateQuality(0.05)).toBe(false);
    expect(validateQuality(1.1)).toBe(false);
    expect(validateQuality(-1)).toBe(false);
  });
});

describe('validateMaxWidth', () => {
  test('应该验证有效的宽度值', () => {
    expect(validateMaxWidth(0)).toBe(true);
    expect(validateMaxWidth(1000)).toBe(true);
    expect(validateMaxWidth(5000)).toBe(true);
  });

  test('应该拒绝无效的宽度值', () => {
    expect(validateMaxWidth(-1)).toBe(false);
    expect(validateMaxWidth(5001)).toBe(false);
  });
});

describe('calculateResizedDimensions', () => {
  test('当maxWidth为0时应该返回原始尺寸', () => {
    const result = calculateResizedDimensions(1000, 800, 0);
    expect(result).toEqual({ width: 1000, height: 800 });
  });

  test('当原始宽度小于maxWidth时应该返回原始尺寸', () => {
    const result = calculateResizedDimensions(500, 400, 1000);
    expect(result).toEqual({ width: 500, height: 400 });
  });

  test('应该按比例调整尺寸', () => {
    const result = calculateResizedDimensions(1000, 800, 500);
    expect(result).toEqual({ width: 500, height: 400 });
  });

  test('应该正确处理垂直图片', () => {
    const result = calculateResizedDimensions(600, 1000, 300);
    expect(result).toEqual({ width: 300, height: 500 });
  });
});

describe('calculateProgress', () => {
  test('应该计算正确的进度百分比', () => {
    expect(calculateProgress(25, 100)).toBe(25);
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(100, 100)).toBe(100);
  });

  test('应该处理total为0的情况', () => {
    expect(calculateProgress(5, 0)).toBe(0);
  });

  test('应该四舍五入到整数', () => {
    expect(calculateProgress(33, 100)).toBe(33);
    expect(calculateProgress(34, 100)).toBe(34);
  });
});

describe('isValidTheme', () => {
  test('应该验证有效主题', () => {
    expect(isValidTheme('light')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
  });

  test('应该拒绝无效主题', () => {
    expect(isValidTheme('blue')).toBe(false);
    expect(isValidTheme('')).toBe(false);
    expect(isValidTheme('Light')).toBe(false); // 大小写敏感
  });
});

describe('getThemeFromStorage', () => {
  beforeEach(() => {
    // 清理localStorage mock
    jest.clearAllMocks();
  });

  test('应该返回保存的有效主题', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue('dark');
    expect(getThemeFromStorage()).toBe('dark');
  });

  test('应该返回默认主题当保存的主题无效时', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue('invalid');
    expect(getThemeFromStorage()).toBe('light');
  });

  test('应该返回默认主题当没有保存主题时', () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    expect(getThemeFromStorage()).toBe('light');
  });
});

describe('isFileSizeValid', () => {
  test('应该验证小于限制的文件', () => {
    const smallFile = new File(['x'.repeat(1024 * 1024)], 'test.jpg'); // 1MB
    expect(isFileSizeValid(smallFile, 10)).toBe(true);
  });

  test('应该拒绝超过限制的文件', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.jpg'); // 11MB
    expect(isFileSizeValid(largeFile, 10)).toBe(false);
  });

  test('应该使用默认10MB限制', () => {
    const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.jpg'); // 5MB
    expect(isFileSizeValid(file)).toBe(true);
  });
});

describe('getFileExtension', () => {
  test('应该提取文件扩展名', () => {
    expect(getFileExtension('test.jpg')).toBe('jpg');
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('image.JPEG')).toBe('jpeg'); // 转小写
  });

  test('应该处理没有扩展名的文件', () => {
    expect(getFileExtension('test')).toBe('');
    expect(getFileExtension('')).toBe('');
  });

  test('应该处理多个点的文件名', () => {
    expect(getFileExtension('test.backup.jpg')).toBe('jpg');
  });
});

describe('getExtensionFromMimeType', () => {
  test('应该从MIME类型获取正确扩展名', () => {
    expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
    expect(getExtensionFromMimeType('image/png')).toBe('png');
    expect(getExtensionFromMimeType('image/webp')).toBe('webp');
    expect(getExtensionFromMimeType('image/avif')).toBe('avif');
  });

  test('应该为未知MIME类型返回默认扩展名', () => {
    expect(getExtensionFromMimeType('application/pdf')).toBe('jpg');
    expect(getExtensionFromMimeType('text/plain')).toBe('jpg');
    expect(getExtensionFromMimeType('')).toBe('jpg');
  });
});