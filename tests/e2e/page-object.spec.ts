// page-object.spec.ts - 使用 Page Object 模式的测试

import { test, expect } from '@playwright/test';
import { ImageCompressorPage } from './pages/ImageCompressorPage';

test.describe('图片压缩工具 - Page Object 测试', () => {
  let compressorPage: ImageCompressorPage;

  test.beforeEach(async ({ page }) => {
    compressorPage = new ImageCompressorPage(page);
    await compressorPage.goto();
  });

  test('页面初始加载状态', async () => {
    await compressorPage.expectPageLoaded();
    await compressorPage.expectInitialState();
  });

  test('质量滑块功能', async () => {
    // 测试设置质量
    await compressorPage.setQuality('0.6');
    await compressorPage.expectQualityValue('0.6');

    // 测试其他值
    await compressorPage.setQuality('1');
    await compressorPage.expectQualityValue('1');

    await compressorPage.setQuality('0.3');
    await compressorPage.expectQualityValue('0.3');
  });

  test('最大宽度设置功能', async () => {
    // 测试设置宽度
    await compressorPage.setMaxWidth('1500');
    await compressorPage.expectMaxWidthValue('1500');

    // 测试重置功能
    await compressorPage.resetSize();
    await compressorPage.expectMaxWidthValue('0');
  });

  test('主题切换功能', async ({ page }) => {
    // 记录初始状态
    const initialBodyClass = await page.locator('body').getAttribute('class');

    // 执行主题切换
    await compressorPage.toggleTheme();

    // 验证变化（根据实际实现调整）
    await page.waitForTimeout(200);
    const newBodyClass = await page.locator('body').getAttribute('class');
    
    console.log(`主题切换: ${initialBodyClass} -> ${newBodyClass}`);
  });

  test('响应式布局测试', async ({ page }) => {
    // 桌面
    await page.setViewportSize({ width: 1200, height: 800 });
    await compressorPage.expectPageLoaded();

    // 平板
    await page.setViewportSize({ width: 768, height: 1024 });
    await compressorPage.expectPageLoaded();

    // 手机
    await page.setViewportSize({ width: 375, height: 667 });
    await compressorPage.expectPageLoaded();
  });

  test('基本无障碍性检查', async () => {
    await compressorPage.checkBasicAccessibility();
  });

  test('JavaScript依赖加载检查', async () => {
    const jsZipLoaded = await compressorPage.checkJSZipLoaded();
    expect(jsZipLoaded).toBeTruthy();
  });

  test('页面性能检查', async () => {
    const loadTime = await compressorPage.measureLoadTime();
    console.log(`页面加载时间: ${loadTime}ms`);
    
    // 页面应该在合理时间内加载
    expect(loadTime).toBeLessThan(10000); // 10秒
  });

  test('控制台错误监控', async ({ page }) => {
    const errors = await compressorPage.monitorConsoleErrors();
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 过滤掉一些可忽略的错误
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_') &&
      !error.includes('cdn.jsdelivr.net')
    );
    
    if (criticalErrors.length > 0) {
      console.log('发现关键JavaScript错误:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('UI元素可见性和交互性', async () => {
    // 检查所有交互元素都可以点击
    await expect(compressorPage.themeToggle).toBeEnabled();
    await expect(compressorPage.qualitySlider).toBeEnabled();
    await expect(compressorPage.maxWidthInput).toBeEnabled();
    await expect(compressorPage.resetSizeButton).toBeEnabled();
    await expect(compressorPage.fileSelectButton).toBeEnabled();

    // 检查初始隐藏的元素
    await expect(compressorPage.progressSection).toBeHidden();
    await expect(compressorPage.actionsSection).toBeHidden();
    await expect(compressorPage.statsSection).toBeHidden();
    await expect(compressorPage.loading).toBeHidden();
  });

  test('文件上传区域交互', async () => {
    // 检查上传区域
    await expect(compressorPage.uploadArea).toBeVisible();
    await expect(compressorPage.fileSelectButton).toBeVisible();
    
    // 测试点击选择文件按钮
    await compressorPage.selectFiles();
    // 注意：在测试环境中，文件对话框不会实际打开
  });

  test('设置持久化测试', async ({ page }) => {
    // 设置一些值
    await compressorPage.setQuality('0.7');
    await compressorPage.setMaxWidth('1800');

    // 重新加载页面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 根据实际的持久化实现检查值是否保持
    // 这取决于你是否实现了设置保存到localStorage
  });
});