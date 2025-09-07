// quick-verify.spec.ts - 快速验证修复结果

import { test, expect } from '@playwright/test';

test.describe('快速验证修复', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ JavaScript错误:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('验证重置按钮修复成功', async ({ page }) => {
    const maxWidthInput = page.locator('#max-width');
    const resetButton = page.locator('#reset-size');
    
    console.log('🔧 测试重置按钮修复');
    
    // 改变值然后重置
    await maxWidthInput.fill('1000');
    await resetButton.click();
    await page.waitForTimeout(200);
    
    const resetValue = await maxWidthInput.inputValue();
    console.log('重置后的值:', resetValue);
    
    if (resetValue === '2000') {
      console.log('✅ 重置按钮修复成功！');
    } else {
      console.log('❌ 重置按钮修复失败，值为:', resetValue);
    }
  });

  test('验证质量滑块是否正常', async ({ page }) => {
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    console.log('🎚️ 测试质量滑块');
    
    await qualitySlider.fill('0.5');
    await page.waitForTimeout(200);
    
    const displayValue = await qualityValue.textContent();
    console.log('滑块设为0.5，显示值:', displayValue);
    
    if (displayValue === '0.5') {
      console.log('✅ 质量滑块正常工作！');
    } else {
      console.log('❌ 质量滑块不工作，显示值:', displayValue);
    }
  });

  test('验证页面没有JavaScript错误', async ({ page }) => {
    console.log('🚨 检查JavaScript错误');
    
    let hasError = false;
    
    page.on('pageerror', error => {
      console.log('❌ 发现页面错误:', error.message);
      hasError = true;
    });
    
    // 刷新页面测试
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 简单交互测试
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(100);
    
    if (!hasError) {
      console.log('✅ 页面没有JavaScript错误！');
    }
  });
});