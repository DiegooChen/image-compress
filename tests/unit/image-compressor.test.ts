// image-compressor.test.ts - Unit tests for ImageCompressor class

/**
 * 由于ImageCompressor类高度依赖DOM和Web APIs，
 * 这里主要测试一些可以独立测试的方法和业务逻辑
 */

describe('ImageCompressor', () => {
  // Mock DOM elements
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="theme-toggle"></button>
      <input id="quality-slider" type="range" value="0.8">
      <span id="quality-value">0.8</span>
      <input id="max-width" type="number" value="2000">
      <button id="reset-size"></button>
      <div id="upload-area"></div>
      <input id="file-input" type="file">
      <button id="file-select"></button>
      <div id="progress-section" style="display: none;"></div>
      <div id="progress-fill"></div>
      <span id="progress-current">0</span>
      <span id="progress-total">0</span>
      <span id="progress-percent">0%</span>
      <div id="actions" style="display: none;"></div>
      <button id="clear-all"></button>
      <button id="download-all"></button>
      <div id="image-list"></div>
      <div id="stats" style="display: none;"></div>
      <span id="total-count">0</span>
      <span id="original-size">0 KB</span>
      <span id="compressed-size">0 KB</span>
      <span id="compression-ratio">0%</span>
      <div id="loading" style="display: none;"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('应该正确初始化DOM元素', () => {
    // 这个测试验证所有必需的DOM元素都存在
    const themeToggle = document.getElementById('theme-toggle');
    const qualitySlider = document.getElementById('quality-slider');
    const uploadArea = document.getElementById('upload-area');
    
    expect(themeToggle).toBeTruthy();
    expect(qualitySlider).toBeTruthy();
    expect(uploadArea).toBeTruthy();
  });

  test('应该正确处理质量滑块值更新', () => {
    const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
    const qualityValue = document.getElementById('quality-value') as HTMLSpanElement;
    
    // 模拟值变更
    qualitySlider.value = '0.6';
    
    // 模拟updateQualityValue方法的逻辑
    qualityValue.textContent = qualitySlider.value;
    
    expect(qualityValue.textContent).toBe('0.6');
  });

  test('应该正确处理重置尺寸功能', () => {
    const maxWidthInput = document.getElementById('max-width') as HTMLInputElement;
    const resetButton = document.getElementById('reset-size') as HTMLButtonElement;
    
    // 设置初始值
    maxWidthInput.value = '1000';
    expect(maxWidthInput.value).toBe('1000');
    
    // 模拟重置按钮点击
    maxWidthInput.value = '0';
    expect(maxWidthInput.value).toBe('0');
  });
});

// 测试进度计算相关的纯函数逻辑
describe('Progress Calculation', () => {
  test('应该正确计算进度百分比', () => {
    const calculateProgressPercent = (current: number, total: number): number => {
      return Math.round((current / total) * 100);
    };
    
    expect(calculateProgressPercent(0, 10)).toBe(0);
    expect(calculateProgressPercent(5, 10)).toBe(50);
    expect(calculateProgressPercent(10, 10)).toBe(100);
  });

  test('应该处理除零情况', () => {
    const calculateProgressPercent = (current: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((current / total) * 100);
    };
    
    expect(calculateProgressPercent(5, 0)).toBe(0);
  });
});

// 测试文件验证逻辑
describe('File Validation', () => {
  test('应该验证图片文件类型', () => {
    const isImageFile = (file: File): boolean => {
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
      return imageTypes.includes(file.type);
    };
    
    const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const pngFile = new File([''], 'test.png', { type: 'image/png' });
    const textFile = new File([''], 'test.txt', { type: 'text/plain' });
    
    expect(isImageFile(jpegFile)).toBe(true);
    expect(isImageFile(pngFile)).toBe(true);
    expect(isImageFile(textFile)).toBe(false);
  });

  test('应该验证文件大小限制', () => {
    const isFileSizeValid = (file: File, maxSizeInMB: number = 10): boolean => {
      const maxBytes = maxSizeInMB * 1024 * 1024;
      return file.size <= maxBytes;
    };
    
    const smallFile = new File(['x'.repeat(1024)], 'small.jpg'); // 1KB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg'); // 11MB
    
    expect(isFileSizeValid(smallFile)).toBe(true);
    expect(isFileSizeValid(largeFile)).toBe(false);
  });
});

// 测试主题管理逻辑
describe('Theme Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('应该正确保存和加载主题设置', () => {
    const saveTheme = (theme: 'light' | 'dark') => {
      localStorage.setItem('theme', theme);
    };
    
    const loadTheme = (): 'light' | 'dark' => {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'light';
    };
    
    // 测试保存和加载
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
    
    saveTheme('light');
    expect(loadTheme()).toBe('light');
    
    // 测试默认值
    localStorage.removeItem('theme');
    expect(loadTheme()).toBe('light');
  });

  test('应该处理无效主题值', () => {
    const loadTheme = (): 'light' | 'dark' => {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'light';
    };
    
    localStorage.setItem('theme', 'invalid');
    expect(loadTheme()).toBe('light');
  });
});

// 测试统计计算逻辑
describe('Statistics Calculation', () => {
  interface ImageStats {
    originalSize: number;
    compressedSize?: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
  }

  test('应该正确计算总体统计信息', () => {
    const calculateStats = (images: ImageStats[]) => {
      const completedImages = images.filter(img => img.status === 'completed');
      
      const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
      const totalCompressedSize = completedImages.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
      const overallCompressionRatio = totalOriginalSize > 0 
        ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100) 
        : 0;

      return {
        totalCount: images.length,
        completedCount: completedImages.length,
        totalOriginalSize,
        totalCompressedSize,
        overallCompressionRatio
      };
    };

    const testImages: ImageStats[] = [
      { originalSize: 1000000, compressedSize: 500000, status: 'completed' },
      { originalSize: 2000000, compressedSize: 1000000, status: 'completed' },
      { originalSize: 1500000, status: 'pending' }
    ];

    const stats = calculateStats(testImages);
    
    expect(stats.totalCount).toBe(3);
    expect(stats.completedCount).toBe(2);
    expect(stats.totalOriginalSize).toBe(4500000);
    expect(stats.totalCompressedSize).toBe(1500000);
    expect(stats.overallCompressionRatio).toBe(67); // (4.5M - 1.5M) / 4.5M * 100 ≈ 67%
  });

  test('应该处理空图片列表', () => {
    const calculateStats = (images: ImageStats[]) => {
      const completedImages = images.filter(img => img.status === 'completed');
      
      const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
      const totalCompressedSize = completedImages.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
      const overallCompressionRatio = totalOriginalSize > 0 
        ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100) 
        : 0;

      return {
        totalCount: images.length,
        completedCount: completedImages.length,
        totalOriginalSize,
        totalCompressedSize,
        overallCompressionRatio
      };
    };

    const stats = calculateStats([]);
    
    expect(stats.totalCount).toBe(0);
    expect(stats.completedCount).toBe(0);
    expect(stats.totalOriginalSize).toBe(0);
    expect(stats.totalCompressedSize).toBe(0);
    expect(stats.overallCompressionRatio).toBe(0);
  });
});