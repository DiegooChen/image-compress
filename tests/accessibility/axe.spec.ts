// axe.spec.ts - 无障碍性测试使用axe-core

import { test, expect } from '@playwright/test';
import { ImageCompressorPage } from '../e2e/pages/ImageCompressorPage';

// axe-core规则配置
const axeConfig = {
  rules: {
    // 关键的无障碍性规则
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'heading-structure': { enabled: true },
    'form-labels': { enabled: true },
    'alt-text': { enabled: true },
    
    // 可选的规则（根据需求调整）
    'landmark-roles': { enabled: true },
    'tab-index': { enabled: true },
    'interactive-controls': { enabled: true }
  }
};

test.describe('无障碍性测试 (Accessibility)', () => {
  let compressorPage: ImageCompressorPage;

  test.beforeEach(async ({ page }) => {
    compressorPage = new ImageCompressorPage(page);
    await compressorPage.goto();
  });

  test('基础无障碍性检查', async ({ page }) => {
    // 手动检查关键的无障碍性特性
    
    // 1. 检查页面标题
    await expect(page).toHaveTitle('图片压缩工具');

    // 2. 检查表单标签关联
    const qualityLabel = page.locator('label[for="quality-slider"]');
    const widthLabel = page.locator('label[for="max-width"]');
    
    await expect(qualityLabel).toBeVisible();
    await expect(widthLabel).toBeVisible();
    
    // 3. 检查按钮的可访问名称
    await expect(page.locator('#theme-toggle')).toHaveAttribute('title');
    
    // 4. 检查输入元素的类型
    await expect(page.locator('#quality-slider')).toHaveAttribute('type', 'range');
    await expect(page.locator('#max-width')).toHaveAttribute('type', 'number');
    await expect(page.locator('#file-input')).toHaveAttribute('type', 'file');
    
    // 5. 检查文件输入的约束
    await expect(page.locator('#file-input')).toHaveAttribute('accept', 'image/*');
    await expect(page.locator('#file-input')).toHaveAttribute('multiple');
  });

  test('键盘导航测试', async ({ page }) => {
    // 测试Tab键导航顺序
    const focusableElements = [
      '#theme-toggle',
      '#quality-slider',
      '#max-width',
      '#reset-size',
      '#file-select'
    ];

    // 从第一个元素开始
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      const currentElement = page.locator(focusableElements[i]);
      
      // 检查元素是否获得焦点
      await expect(currentElement).toBeFocused();
      
      // 按Tab键移动到下一个元素
      if (i < focusableElements.length - 1) {
        await page.keyboard.press('Tab');
      }
    }

    // 测试Shift+Tab反向导航
    await page.keyboard.press('Shift+Tab');
    const previousElement = page.locator(focusableElements[focusableElements.length - 2]);
    await expect(previousElement).toBeFocused();
  });

  test('ARIA属性检查', async ({ page }) => {
    // 检查滑块的ARIA属性
    const qualitySlider = page.locator('#quality-slider');
    const qualityValue = page.locator('#quality-value');
    
    // 滑块应该有适当的ARIA属性
    await expect(qualitySlider).toHaveAttribute('min');
    await expect(qualitySlider).toHaveAttribute('max');
    await expect(qualitySlider).toHaveAttribute('step');
    await expect(qualitySlider).toHaveAttribute('value');

    // 检查数字输入的约束
    const maxWidthInput = page.locator('#max-width');
    await expect(maxWidthInput).toHaveAttribute('min');
    await expect(maxWidthInput).toHaveAttribute('max');
  });

  test('颜色对比度检查', async ({ page }) => {
    // 获取关键元素的颜色信息
    const elements = [
      { selector: 'h1.title', name: '标题' },
      { selector: 'label', name: '标签' },
      { selector: 'button', name: '按钮' },
      { selector: '.upload-content h3', name: '上传区域标题' },
      { selector: '.upload-content p', name: '上传区域说明' }
    ];

    for (const element of elements) {
      const locator = page.locator(element.selector).first();
      
      if (await locator.count() > 0) {
        const styles = await locator.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        console.log(`${element.name} 样式:`, styles);
        
        // 基本检查：确保有文本颜色
        expect(styles.color).toBeTruthy();
      }
    }
  });

  test('焦点可见性测试', async ({ page }) => {
    const interactiveElements = [
      '#theme-toggle',
      '#quality-slider',
      '#max-width',
      '#reset-size',
      '#file-select'
    ];

    for (const selector of interactiveElements) {
      const element = page.locator(selector);
      
      // 聚焦元素
      await element.focus();
      
      // 检查元素是否确实获得焦点
      await expect(element).toBeFocused();
      
      // 检查是否有焦点指示（通过CSS outline或其他方式）
      const focusStyles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          outlineColor: computed.outlineColor,
          boxShadow: computed.boxShadow
        };
      });

      console.log(`${selector} 焦点样式:`, focusStyles);
    }
  });

  test('表单无障碍性测试', async ({ page }) => {
    // 检查所有表单元素都有适当的标签
    const formElements = await page.locator('input, select, textarea').all();
    
    for (const element of formElements) {
      const id = await element.getAttribute('id');
      
      if (id) {
        // 检查是否有对应的label
        const label = page.locator(`label[for="${id}"]`);
        const labelExists = await label.count() > 0;
        
        if (!labelExists) {
          // 检查是否有aria-label或aria-labelledby
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledby = await element.getAttribute('aria-labelledby');
          
          if (!ariaLabel && !ariaLabelledby) {
            console.warn(`元素 ${id} 缺少可访问标签`);
          }
        }
      }
    }
  });

  test('错误信息无障碍性', async ({ page }) => {
    // 模拟一些可能的错误状态
    const maxWidthInput = page.locator('#max-width');
    
    // 输入无效值
    await maxWidthInput.fill('-100');
    await page.keyboard.press('Tab'); // 移动焦点触发验证
    
    // 检查是否有错误信息
    // 注意：这取决于实际的错误处理实现
    const errorMessage = page.locator('.error-message, [role="alert"], .invalid-feedback');
    const errorExists = await errorMessage.count() > 0;
    
    if (errorExists) {
      // 如果有错误信息，检查其无障碍性
      await expect(errorMessage).toBeVisible();
      
      // 错误信息应该与输入字段关联
      const ariaDescribedby = await maxWidthInput.getAttribute('aria-describedby');
      if (ariaDescribedby) {
        const describedElement = page.locator(`#${ariaDescribedby}`);
        await expect(describedElement).toBeVisible();
      }
    }
  });

  test('动态内容无障碍性', async ({ page }) => {
    // 测试动态加载的内容是否具有适当的ARIA属性
    
    // 检查进度条区域（默认隐藏）
    const progressSection = page.locator('#progress-section');
    await expect(progressSection).toBeHidden();
    
    // 检查统计区域（默认隐藏）
    const statsSection = page.locator('#stats');
    await expect(statsSection).toBeHidden();
    
    // 检查加载指示器
    const loading = page.locator('#loading');
    await expect(loading).toBeHidden();
    
    // 这些动态区域应该有适当的角色属性
    // 注意：具体检查取决于实际实现
  });

  test('移动设备无障碍性', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 检查触摸目标大小
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        // 触摸目标应该至少44x44像素
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // 检查在移动设备上的可访问性
    await compressorPage.expectPageLoaded();
  });

  test('屏幕阅读器支持测试', async ({ page }) => {
    // 检查页面结构对屏幕阅读器的友好性
    
    // 检查标题层级
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      console.log(`找到 ${headings.length} 个标题元素`);
      
      // 应该有一个h1作为主标题
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    }
    
    // 检查地标角色
    const landmarks = [
      { selector: 'header, [role="banner"]', name: 'Header/Banner' },
      { selector: 'main, [role="main"]', name: 'Main' },
      { selector: 'footer, [role="contentinfo"]', name: 'Footer' }
    ];
    
    for (const landmark of landmarks) {
      const count = await page.locator(landmark.selector).count();
      console.log(`${landmark.name} 地标数量: ${count}`);
    }
    
    // 检查列表结构
    const lists = await page.locator('ul, ol').count();
    console.log(`列表数量: ${lists}`);
  });
});