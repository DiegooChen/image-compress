// lighthouse.spec.ts - Lighthouse性能测试集成

import { test, expect } from '@playwright/test';

test.describe('Lighthouse 性能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('基础性能指标检查', async ({ page }) => {
    // 测试页面加载时间
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`页面加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5秒内加载完成

    // 检查关键资源
    const performanceEntries = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length === 0) return null;
      
      const entry = entries[0];
      return {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        load: entry.loadEventEnd - entry.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    if (performanceEntries) {
      console.log('性能指标:', performanceEntries);
      
      // DOM Content Loaded 应该在合理时间内完成
      expect(performanceEntries.domContentLoaded).toBeLessThan(3000);
      
      // 如果有首次绘制数据，检查它们
      if (performanceEntries.firstContentfulPaint > 0) {
        expect(performanceEntries.firstContentfulPaint).toBeLessThan(3000);
      }
    }
  });

  test('资源加载性能检查', async ({ page }) => {
    // 监听资源加载
    const resources: Array<{url: string, duration: number, size?: number}> = [];
    
    page.on('response', response => {
      const request = response.request();
      const timing = response.timing();
      resources.push({
        url: response.url(),
        duration: timing.responseEnd - timing.requestStart,
        size: response.headers()['content-length'] ? parseInt(response.headers()['content-length']) : undefined
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 分析资源加载情况
    console.log(`加载了 ${resources.length} 个资源`);
    
    // 检查关键资源的加载时间
    const cssFiles = resources.filter(r => r.url.endsWith('.css'));
    const jsFiles = resources.filter(r => r.url.endsWith('.js'));
    const imageFiles = resources.filter(r => r.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));

    console.log(`CSS文件: ${cssFiles.length}, JS文件: ${jsFiles.length}, 图片: ${imageFiles.length}`);

    // 检查是否有加载时间过长的资源
    const slowResources = resources.filter(r => r.duration > 5000);
    if (slowResources.length > 0) {
      console.warn('慢速资源:', slowResources);
    }
    
    expect(slowResources.length).toBeLessThan(3); // 最多允许2个慢速资源
  });

  test('内存使用检查', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查内存使用情况
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore - Chrome DevTools Memory API
      if (typeof performance.memory !== 'undefined') {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (memoryInfo) {
      console.log('内存使用情况:', {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });

      // 内存使用不应超过50MB（根据应用复杂度调整）
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('网络效率检查', async ({ page }) => {
    let totalTransferred = 0;
    let resourceCount = 0;

    page.on('response', async response => {
      const contentLength = response.headers()['content-length'];
      if (contentLength) {
        totalTransferred += parseInt(contentLength);
      }
      resourceCount++;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`总传输量: ${Math.round(totalTransferred / 1024)}KB`);
    console.log(`资源数量: ${resourceCount}`);

    // 总传输量不应超过5MB（根据应用需求调整）
    expect(totalTransferred).toBeLessThan(5 * 1024 * 1024);
    
    // 资源数量不应过多
    expect(resourceCount).toBeLessThan(50);
  });

  test('关键渲染路径检查', async ({ page }) => {
    await page.goto('/');
    
    // 检查关键CSS是否内联或快速加载
    const criticalElements = [
      '.container',
      '.header',
      '.upload-area',
      '#quality-slider'
    ];

    for (const selector of criticalElements) {
      await expect(page.locator(selector)).toBeVisible({ timeout: 3000 });
    }

    // 检查JavaScript是否阻塞渲染
    const scriptTags = await page.locator('script').count();
    console.log(`Script标签数量: ${scriptTags}`);

    // 检查CSS是否阻塞渲染
    const linkTags = await page.locator('link[rel="stylesheet"]').count();
    console.log(`CSS链接数量: ${linkTags}`);
  });

  test('缓存策略检查', async ({ page }) => {
    const cacheableResources: string[] = [];
    const nonCacheableResources: string[] = [];

    page.on('response', response => {
      const cacheControl = response.headers()['cache-control'];
      const expires = response.headers()['expires'];
      const etag = response.headers()['etag'];
      const lastModified = response.headers()['last-modified'];

      const hasCaching = cacheControl || expires || etag || lastModified;
      
      if (response.url().match(/\.(css|js|jpg|jpeg|png|gif|webp|svg|woff|woff2)$/)) {
        if (hasCaching) {
          cacheableResources.push(response.url());
        } else {
          nonCacheableResources.push(response.url());
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`可缓存静态资源: ${cacheableResources.length}`);
    console.log(`不可缓存静态资源: ${nonCacheableResources.length}`);

    if (nonCacheableResources.length > 0) {
      console.warn('缺少缓存头的资源:', nonCacheableResources);
    }

    // 大部分静态资源应该有缓存策略
    const cacheRatio = cacheableResources.length / (cacheableResources.length + nonCacheableResources.length);
    expect(cacheRatio).toBeGreaterThan(0.7); // 至少70%的静态资源应该可缓存
  });

  test('响应式图片优化检查', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查是否使用了响应式图片
    const images = await page.locator('img').all();
    let responsiveImages = 0;

    for (const img of images) {
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');
      
      if (srcset || sizes) {
        responsiveImages++;
      }
    }

    console.log(`响应式图片数量: ${responsiveImages}/${images.length}`);
    
    // 如果有图片，建议使用响应式图片
    if (images.length > 0) {
      console.log(`响应式图片比例: ${Math.round(responsiveImages / images.length * 100)}%`);
    }
  });
});