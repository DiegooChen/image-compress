import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('图片压缩工具测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9000');
  });

  test('页面基本元素加载测试', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle('图片压缩工具');
    
    // 检查主要UI元素是否存在
    await expect(page.locator('h1.title')).toHaveText('图片压缩工具');
    await expect(page.locator('#theme-toggle')).toBeVisible();
    await expect(page.locator('#quality-slider')).toBeVisible();
    await expect(page.locator('#max-width')).toBeVisible();
    await expect(page.locator('#upload-area')).toBeVisible();
    await expect(page.locator('#file-select')).toBeVisible();
  });

  test('压缩质量滑块功能测试', async ({ page }) => {
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    // 检查初始值
    await expect(qualitySlider).toHaveValue('0.8');
    await expect(qualityValue).toHaveText('0.8');
    
    // 测试滑块调整
    await qualitySlider.fill('0.5');
    await expect(qualityValue).toHaveText('0.5');
    
    await qualitySlider.fill('1');
    await expect(qualityValue).toHaveText('1');
  });

  test('最大宽度设置功能测试', async ({ page }) => {
    const maxWidthInput = page.locator('#max-width');
    const resetButton = page.locator('#reset-size');
    
    // 检查初始值
    await expect(maxWidthInput).toHaveValue('2000');
    
    // 测试修改宽度
    await maxWidthInput.fill('1500');
    await expect(maxWidthInput).toHaveValue('1500');
    
    // 测试重置按钮
    await resetButton.click();
    // 重置后应该清空或恢复默认值
  });

  test('主题切换功能测试', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    const body = page.locator('body');
    
    // 点击主题切换按钮
    await themeToggle.click();
    
    // 检查是否有主题类被添加到body
    // 这里需要根据实际的主题切换逻辑进行调整
    await page.waitForTimeout(100);
  });

  test('上传区域交互测试', async ({ page }) => {
    const uploadArea = page.locator('#upload-area');
    const fileSelect = page.locator('#file-select');
    const fileInput = page.locator('#file-input');
    
    // 检查上传区域可见性
    await expect(uploadArea).toBeVisible();
    await expect(fileSelect).toBeVisible();
    
    // 测试点击选择文件按钮
    await fileSelect.click();
    // 文件输入框应该被触发（但在测试环境中可能无法直接验证）
  });

  test('响应式设计测试', async ({ page }) => {
    // 测试不同屏幕尺寸下的布局
    
    // 桌面尺寸
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.container')).toBeVisible();
    
    // 平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.container')).toBeVisible();
    
    // 手机尺寸
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
  });

  test('页面无障碍性测试', async ({ page }) => {
    // 检查重要元素的标签
    await expect(page.locator('label[for="quality-slider"]')).toHaveText('压缩质量:');
    await expect(page.locator('label[for="max-width"]')).toHaveText('最大宽度 (px):');
    
    // 检查按钮的可访问性
    await expect(page.locator('#theme-toggle')).toHaveAttribute('title', '切换主题');
    
    // 检查文件输入的accept属性
    await expect(page.locator('#file-input')).toHaveAttribute('accept', 'image/*');
  });

  test('错误处理测试', async ({ page }) => {
    // 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 监听未捕获的异常
    const uncaughtExceptions: string[] = [];
    page.on('pageerror', exception => {
      uncaughtExceptions.push(exception.toString());
    });

    // 刷新页面并等待加载
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 检查是否有JavaScript错误
    expect(consoleErrors.length).toBe(0);
    expect(uncaughtExceptions.length).toBe(0);
  });

  test('性能测试', async ({ page }) => {
    // 开始性能监控
    await page.goto('http://localhost:9000');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面加载性能
    const performanceTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        load: perf.loadEventEnd - perf.loadEventStart,
      };
    });
    
    // 验证加载时间在合理范围内（可根据需要调整阈值）
    expect(performanceTiming.domContentLoaded).toBeLessThan(5000);
    expect(performanceTiming.load).toBeLessThan(10000);
  });

  test('JavaScript依赖加载测试', async ({ page }) => {
    // 监听网络请求
    const failedRequests: string[] = [];
    
    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('http://localhost:9000');
    await page.waitForLoadState('networkidle');
    
    // 检查JSZip是否正确加载
    const jsZipLoaded = await page.evaluate(() => {
      return typeof window.JSZip !== 'undefined';
    });
    
    expect(jsZipLoaded).toBeTruthy();
    expect(failedRequests.length).toBe(0);
  });
});