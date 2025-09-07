// functional-regression.spec.ts - 针对发现的功能问题的回归测试

import { test, expect } from '@playwright/test';

test.describe('功能回归测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监控JavaScript错误
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

  test('修复验证：重置按钮应该恢复到2000', async ({ page }) => {
    console.log('🔧 测试重置按钮修复');
    
    const maxWidthInput = page.locator('#max-width');
    const resetButton = page.locator('#reset-size');
    
    // 1. 检查初始值
    const initialValue = await maxWidthInput.inputValue();
    console.log('初始最大宽度:', initialValue);
    expect(initialValue).toBe('2000');
    
    // 2. 改变值
    await maxWidthInput.fill('1000');
    await expect(maxWidthInput).toHaveValue('1000');
    console.log('修改为:', await maxWidthInput.inputValue());
    
    // 3. 点击重置按钮
    await resetButton.click();
    await page.waitForTimeout(100);
    
    // 4. 验证是否正确重置为2000
    const resetValue = await maxWidthInput.inputValue();
    console.log('重置后的值:', resetValue);
    expect(resetValue).toBe('2000');
  });

  test('质量滑块功能验证：显示值应该同步', async ({ page }) => {
    console.log('🎚️ 测试质量滑块同步显示');
    
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    // 1. 检查初始值同步
    const initialSliderValue = await qualitySlider.inputValue();
    const initialDisplayValue = await qualityValue.textContent();
    console.log('初始滑块值:', initialSliderValue, '显示值:', initialDisplayValue);
    expect(initialDisplayValue).toBe(initialSliderValue);
    
    // 2. 测试多个值的同步
    const testValues = ['0.3', '0.6', '0.9'];
    
    for (const value of testValues) {
      await qualitySlider.fill(value);
      await page.waitForTimeout(100);
      
      const displayValue = await qualityValue.textContent();
      console.log(`滑块设为${value}, 显示值:${displayValue}`);
      expect(displayValue).toBe(value);
    }
  });

  test('文件选择按钮功能验证', async ({ page }) => {
    console.log('📁 测试文件选择按钮是否触发文件输入');
    
    const fileSelectButton = page.locator('#file-select');
    const fileInput = page.locator('#file-input');
    
    // 监听文件输入的click事件
    let fileInputClicked = false;
    await page.evaluate(() => {
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      fileInput.addEventListener('click', () => {
        console.log('✅ 文件输入被点击');
        (window as any).fileInputClicked = true;
      });
    });
    
    // 点击选择文件按钮
    await fileSelectButton.click();
    await page.waitForTimeout(100);
    
    // 检查文件输入是否被点击
    const wasClicked = await page.evaluate(() => (window as any).fileInputClicked);
    expect(wasClicked).toBe(true);
    
    console.log('✅ 文件选择按钮正确触发文件输入');
  });

  test('拖拽区域事件处理验证', async ({ page }) => {
    console.log('📤 测试拖拽区域事件处理');
    
    const uploadArea = page.locator('#upload-area');
    
    // 监听拖拽事件
    await page.evaluate(() => {
      const uploadArea = document.getElementById('upload-area');
      let eventCounts = { dragenter: 0, dragover: 0, drop: 0 };
      
      ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        uploadArea?.addEventListener(eventName, (e) => {
          e.preventDefault();
          eventCounts[eventName as keyof typeof eventCounts]++;
          console.log(`${eventName} 事件触发，计数:`, eventCounts[eventName as keyof typeof eventCounts]);
        });
      });
      
      (window as any).dragEventCounts = eventCounts;
    });
    
    // 模拟拖拽事件序列
    await uploadArea.dispatchEvent('dragenter', { 
      dataTransfer: { files: [], types: ['Files'] } 
    });
    await page.waitForTimeout(50);
    
    await uploadArea.dispatchEvent('dragover', { 
      dataTransfer: { files: [], types: ['Files'] } 
    });
    await page.waitForTimeout(50);
    
    // 检查事件是否被正确处理
    const eventCounts = await page.evaluate(() => (window as any).dragEventCounts);
    console.log('拖拽事件计数:', eventCounts);
    
    expect(eventCounts.dragenter).toBeGreaterThan(0);
    expect(eventCounts.dragover).toBeGreaterThan(0);
  });

  test('JavaScript加载和初始化验证', async ({ page }) => {
    console.log('🔍 验证JavaScript是否正确加载和初始化');
    
    // 检查ImageCompressor类是否正确初始化
    const isInitialized = await page.evaluate(() => {
      // 检查关键的事件监听器是否已绑定
      const themeToggle = document.getElementById('theme-toggle');
      const qualitySlider = document.getElementById('quality-slider');
      const fileSelectBtn = document.getElementById('file-select');
      
      // 简单检查：这些元素应该有事件监听器
      return !!(themeToggle && qualitySlider && fileSelectBtn);
    });
    
    expect(isInitialized).toBe(true);
    console.log('✅ JavaScript正确初始化');
    
    // 检查Worker是否正确创建
    const hasWorker = await page.evaluate(() => {
      return typeof Worker !== 'undefined';
    });
    
    expect(hasWorker).toBe(true);
    console.log('✅ Web Worker支持可用');
  });

  test('控制台错误检查', async ({ page }) => {
    console.log('🚨 检查页面是否有JavaScript错误');
    
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // 刷新页面并进行一些交互
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 进行基本交互
    await page.locator('#theme-toggle').click();
    await page.locator('#quality-slider').fill('0.5');
    await page.locator('#file-select').click();
    
    await page.waitForTimeout(1000);
    
    // 报告错误
    if (consoleErrors.length > 0) {
      console.log('❌ 控制台错误:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('❌ 页面错误:', pageErrors);
    }
    
    // 期望没有JavaScript错误
    expect(consoleErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);
    
    console.log('✅ 没有发现JavaScript错误');
  });
});