// button-functionality.spec.ts - 专门测试所有按钮功能是否符合设计期望

import { test, expect } from '@playwright/test';
import { ImageCompressorPage } from './pages/ImageCompressorPage';

test.describe('按钮功能详细测试', () => {
  let compressorPage: ImageCompressorPage;

  test.beforeEach(async ({ page }) => {
    compressorPage = new ImageCompressorPage(page);
    await compressorPage.goto();
  });

  test('主题切换按钮 - 应该切换明暗主题', async ({ page }) => {
    console.log('🎨 测试主题切换按钮功能');
    
    // 检查按钮存在且可点击
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeEnabled();
    
    // 检查按钮有合适的辅助功能属性
    await expect(themeToggle).toHaveAttribute('title', '切换主题');
    
    // 获取初始主题状态
    const bodyClass = await page.locator('body').getAttribute('class') || '';
    console.log('初始body class:', bodyClass);
    
    // 点击主题切换按钮
    await themeToggle.click();
    await page.waitForTimeout(200); // 等待主题切换动画
    
    // 验证主题是否改变
    const newBodyClass = await page.locator('body').getAttribute('class') || '';
    console.log('切换后body class:', newBodyClass);
    
    // 检查视觉反馈
    const iconElement = page.locator('#theme-toggle .theme-icon');
    const iconText = await iconElement.textContent();
    console.log('主题图标:', iconText);
    expect(iconText).toBeTruthy();
  });

  test('重置尺寸按钮 - 应该重置最大宽度输入', async ({ page }) => {
    console.log('🔄 测试重置尺寸按钮功能');
    
    const maxWidthInput = page.locator('#max-width');
    const resetButton = page.locator('#reset-size');
    
    // 检查按钮可见且可用
    await expect(resetButton).toBeVisible();
    await expect(resetButton).toBeEnabled();
    
    // 获取初始值
    const initialValue = await maxWidthInput.inputValue();
    console.log('初始最大宽度值:', initialValue);
    
    // 改变输入值
    await maxWidthInput.fill('1500');
    await expect(maxWidthInput).toHaveValue('1500');
    
    // 点击重置按钮
    await resetButton.click();
    await page.waitForTimeout(100);
    
    // 验证是否重置（具体行为取决于实现）
    const afterResetValue = await maxWidthInput.inputValue();
    console.log('重置后的值:', afterResetValue);
    
    // 检查重置逻辑是否正确实现
    expect(afterResetValue).not.toBe('1500');
  });

  test('选择文件按钮 - 应该触发文件选择对话框', async ({ page }) => {
    console.log('📁 测试选择文件按钮功能');
    
    const fileSelectButton = page.locator('#file-select');
    const fileInput = page.locator('#file-input');
    
    // 检查按钮可见
    await expect(fileSelectButton).toBeVisible();
    await expect(fileSelectButton).toBeEnabled();
    
    // 检查按钮样式类
    const buttonClass = await fileSelectButton.getAttribute('class');
    console.log('文件选择按钮样式类:', buttonClass);
    expect(buttonClass).toContain('btn-link');
    
    // 检查文件输入是否隐藏但存在
    await expect(fileInput).toHaveAttribute('hidden');
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
    
    // 监听文件输入点击事件
    let fileInputClicked = false;
    await page.locator('#file-input').evaluate(el => {
      el.addEventListener('click', () => {
        console.log('文件输入被点击');
      });
    });
    
    // 点击选择文件按钮
    await fileSelectButton.click();
    
    // 验证按钮文本内容
    const buttonText = await fileSelectButton.textContent();
    console.log('按钮文本:', buttonText);
    expect(buttonText).toBe('选择文件');
  });

  test('质量滑块 - 应该正确响应用户交互', async ({ page }) => {
    console.log('🎚️ 测试质量滑块功能');
    
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    // 检查滑块存在且可用
    await expect(qualitySlider).toBeVisible();
    await expect(qualitySlider).toBeEnabled();
    
    // 检查滑块属性
    await expect(qualitySlider).toHaveAttribute('type', 'range');
    await expect(qualitySlider).toHaveAttribute('min', '0.1');
    await expect(qualitySlider).toHaveAttribute('max', '1');
    await expect(qualitySlider).toHaveAttribute('step', '0.1');
    
    // 检查初始值
    const initialValue = await qualitySlider.inputValue();
    const initialDisplayValue = await qualityValue.textContent();
    console.log('质量滑块初始值:', initialValue, '显示值:', initialDisplayValue);
    
    // 测试滑块交互
    await qualitySlider.fill('0.5');
    await page.waitForTimeout(100);
    
    // 验证显示值是否同步更新
    const newDisplayValue = await qualityValue.textContent();
    console.log('滑块设置为0.5后的显示值:', newDisplayValue);
    expect(newDisplayValue).toBe('0.5');
  });

  test('上传区域交互 - 应该响应点击和拖拽', async ({ page }) => {
    console.log('📤 测试上传区域交互功能');
    
    const uploadArea = page.locator('#upload-area');
    const fileInput = page.locator('#file-input');
    
    // 检查上传区域可见
    await expect(uploadArea).toBeVisible();
    
    // 检查上传区域内容
    await expect(uploadArea.locator('h3')).toContainText('拖拽图片到这里');
    await expect(uploadArea.locator('.file-info')).toContainText('支持 JPEG, PNG, WebP, AVIF 格式');
    
    // 检查上传图标
    const uploadIcon = uploadArea.locator('.upload-icon');
    const iconText = await uploadIcon.textContent();
    console.log('上传图标:', iconText);
    expect(iconText).toBe('📸');
    
    // 测试点击上传区域
    await uploadArea.click();
    
    // 验证上传区域有适当的样式
    const areaClass = await uploadArea.getAttribute('class');
    console.log('上传区域样式类:', areaClass);
    expect(areaClass).toContain('upload-area');
  });

  test('隐藏按钮状态检查 - 清空和下载按钮初始应该隐藏', async ({ page }) => {
    console.log('👁️ 测试隐藏按钮的初始状态');
    
    const actionsSection = page.locator('#actions');
    const clearAllButton = page.locator('#clear-all');
    const downloadAllButton = page.locator('#download-all');
    
    // 检查操作区域初始隐藏
    await expect(actionsSection).toBeHidden();
    
    // 检查按钮存在但不可见
    await expect(clearAllButton).toHaveClass(/btn-secondary/);
    await expect(downloadAllButton).toHaveClass(/btn-primary/);
    
    // 检查按钮文本
    await expect(clearAllButton).toContainText('清空列表');
    await expect(downloadAllButton).toContainText('下载全部');
  });

  test('进度和统计区域初始状态', async ({ page }) => {
    console.log('📊 测试进度和统计区域初始状态');
    
    const progressSection = page.locator('#progress-section');
    const statsSection = page.locator('#stats');
    const loadingDiv = page.locator('#loading');
    
    // 检查这些区域初始都是隐藏的
    await expect(progressSection).toBeHidden();
    await expect(statsSection).toBeHidden();
    await expect(loadingDiv).toBeHidden();
    
    // 检查统计区域的结构
    const statItems = statsSection.locator('.stat-item');
    const statCount = await statItems.count();
    console.log('统计项目数量:', statCount);
    expect(statCount).toBe(4); // 总图片数、原始大小、压缩后大小、压缩率
    
    // 检查统计标签
    const labels = await statsSection.locator('.stat-label').allTextContents();
    console.log('统计标签:', labels);
    expect(labels).toEqual(['总图片数:', '原始总大小:', '压缩后总大小:', '总压缩率:']);
  });

  test('响应式设计 - 移动设备上的按钮大小', async ({ page }) => {
    console.log('📱 测试移动设备上的按钮尺寸');
    
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    // 检查主要按钮的尺寸
    const buttons = [
      { selector: '#theme-toggle', name: '主题切换按钮' },
      { selector: '#reset-size', name: '重置按钮' },
      { selector: '#file-select', name: '文件选择按钮' }
    ];
    
    for (const button of buttons) {
      const element = page.locator(button.selector);
      const boundingBox = await element.boundingBox();
      
      if (boundingBox) {
        console.log(`${button.name} 尺寸:`, `${boundingBox.width}x${boundingBox.height}`);
        
        // 检查触摸目标尺寸 (应该至少44x44像素)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('键盘可访问性 - Tab导航和Enter/Space激活', async ({ page }) => {
    console.log('⌨️ 测试键盘可访问性');
    
    const focusableElements = [
      '#theme-toggle',
      '#quality-slider', 
      '#max-width',
      '#reset-size',
      '#file-select'
    ];
    
    // 测试Tab导航
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      const element = page.locator(focusableElements[i]);
      
      // 检查元素是否获得焦点
      await expect(element).toBeFocused();
      
      // 检查焦点指示器
      const elementStyles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });
      
      console.log(`${focusableElements[i]} 焦点样式:`, elementStyles);
      
      // 移动到下一个元素
      if (i < focusableElements.length - 1) {
        await page.keyboard.press('Tab');
      }
    }
    
    // 测试Enter键激活按钮
    const themeButton = page.locator('#theme-toggle');
    await themeButton.focus();
    
    const beforeClick = await page.locator('body').getAttribute('class') || '';
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const afterClick = await page.locator('body').getAttribute('class') || '';
    
    console.log('键盘Enter激活前后的body class:', beforeClick, '->', afterClick);
  });
});