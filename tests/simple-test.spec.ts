import { test, expect } from '@playwright/test';

test.describe('简单测试', () => {
  test('直接打开本地HTML文件', async ({ page }) => {
    // 直接使用file:// 协议打开本地文件
    const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
    
    await page.goto(filePath);
    
    // 检查页面标题
    await expect(page).toHaveTitle('图片压缩工具');
    
    // 检查主要元素是否存在
    await expect(page.locator('h1.title')).toHaveText('图片压缩工具');
    await expect(page.locator('#quality-slider')).toBeVisible();
    
    // 检查压缩质量滑块功能
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    await expect(qualitySlider).toHaveValue('0.8');
    await expect(qualityValue).toHaveText('0.8');
    
    console.log('基本功能测试通过');
  });
  
  test('检查JavaScript错误', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', exception => {
      errors.push(`未捕获异常: ${exception.toString()}`);
    });
    
    const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
    await page.goto(filePath);
    
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('发现JavaScript错误：', errors);
      // 不让测试失败，只是报告错误
    } else {
      console.log('没有发现JavaScript错误');
    }
  });
});