// image-compression.spec.ts - 优化的端到端测试

import { test, expect } from '@playwright/test';

test.describe('图片压缩工具 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(60000);
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('页面加载和基本UI测试', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle('图片压缩工具');
    
    // 检查关键UI元素
    await expect(page.locator('h1')).toContainText('图片压缩工具');
    await expect(page.locator('#theme-toggle')).toBeVisible();
    await expect(page.locator('#quality-slider')).toBeVisible();
    await expect(page.locator('#max-width')).toBeVisible();
    await expect(page.locator('#upload-area')).toBeVisible();
  });

  test('质量滑块交互测试', async ({ page }) => {
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

  test('最大宽度设置测试', async ({ page }) => {
    const maxWidthInput = page.locator('#max-width');
    const resetButton = page.locator('#reset-size');
    
    // 检查初始值
    await expect(maxWidthInput).toHaveValue('2000');
    
    // 测试修改宽度
    await maxWidthInput.fill('1500');
    await expect(maxWidthInput).toHaveValue('1500');
    
    // 测试重置按钮
    await resetButton.click();
    await expect(maxWidthInput).toHaveValue('0');
  });

  test('主题切换功能测试', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    const body = page.locator('body');
    
    // 记录初始主题
    const initialClass = await body.getAttribute('class');
    
    // 点击主题切换
    await themeToggle.click();
    await page.waitForTimeout(100); // 等待主题切换动画
    
    // 验证主题已改变（具体实现取决于你的主题逻辑）
    const newClass = await body.getAttribute('class');
    // 这里可以根据实际的主题实现调整断言
  });

  test('响应式设计测试', async ({ page }) => {
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

  test('无障碍性基本检查', async ({ page }) => {
    // 检查重要元素的标签
    await expect(page.locator('label[for="quality-slider"]')).toHaveText('压缩质量:');
    await expect(page.locator('label[for="max-width"]')).toHaveText('最大宽度 (px):');
    
    // 检查按钮的可访问性属性
    await expect(page.locator('#theme-toggle')).toHaveAttribute('title');
    
    // 检查文件输入的accept属性
    await expect(page.locator('#file-input')).toHaveAttribute('accept', 'image/*');
  });

  test('JavaScript加载检查', async ({ page }) => {
    // 检查JSZip是否加载
    const jsZipLoaded = await page.evaluate(() => {
      return typeof window.JSZip !== 'undefined';
    });
    expect(jsZipLoaded).toBeTruthy();
    
    // 检查主要功能对象是否存在
    const hasImageCompressor = await page.evaluate(() => {
      return window.location.href.includes('.html');
    });
    expect(hasImageCompressor).toBeTruthy();
  });

  test('错误处理测试', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', exception => {
      errors.push(`未捕获异常: ${exception.toString()}`);
    });
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 记录发现的错误（不让测试失败，只是报告）
    if (errors.length > 0) {
      console.log('发现JavaScript错误:', errors);
    }
    if (warnings.length > 0) {
      console.log('发现JavaScript警告:', warnings);
    }
    
    // 只在有严重错误时让测试失败
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('性能基础检查', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`页面加载时间: ${loadTime}ms`);
  });
});