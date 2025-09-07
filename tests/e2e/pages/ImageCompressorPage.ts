// ImageCompressorPage.ts - Page Object Model for Image Compressor

import { Page, Locator, expect } from '@playwright/test';

export class ImageCompressorPage {
  readonly page: Page;
  
  // Header elements
  readonly title: Locator;
  readonly themeToggle: Locator;
  
  // Settings elements
  readonly qualitySlider: Locator;
  readonly qualityValue: Locator;
  readonly maxWidthInput: Locator;
  readonly resetSizeButton: Locator;
  
  // Upload elements
  readonly uploadArea: Locator;
  readonly fileInput: Locator;
  readonly fileSelectButton: Locator;
  
  // Progress elements
  readonly progressSection: Locator;
  readonly progressFill: Locator;
  readonly progressCurrent: Locator;
  readonly progressTotal: Locator;
  readonly progressPercent: Locator;
  
  // Action elements
  readonly actionsSection: Locator;
  readonly clearAllButton: Locator;
  readonly downloadAllButton: Locator;
  
  // Display elements
  readonly imageList: Locator;
  readonly statsSection: Locator;
  readonly totalCount: Locator;
  readonly originalSize: Locator;
  readonly compressedSize: Locator;
  readonly compressionRatio: Locator;
  
  // Loading element
  readonly loading: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header elements
    this.title = page.locator('h1.title');
    this.themeToggle = page.locator('#theme-toggle');
    
    // Settings elements
    this.qualitySlider = page.locator('#quality-slider');
    this.qualityValue = page.locator('#quality-value');
    this.maxWidthInput = page.locator('#max-width');
    this.resetSizeButton = page.locator('#reset-size');
    
    // Upload elements
    this.uploadArea = page.locator('#upload-area');
    this.fileInput = page.locator('#file-input');
    this.fileSelectButton = page.locator('#file-select');
    
    // Progress elements
    this.progressSection = page.locator('#progress-section');
    this.progressFill = page.locator('#progress-fill');
    this.progressCurrent = page.locator('#progress-current');
    this.progressTotal = page.locator('#progress-total');
    this.progressPercent = page.locator('#progress-percent');
    
    // Action elements
    this.actionsSection = page.locator('#actions');
    this.clearAllButton = page.locator('#clear-all');
    this.downloadAllButton = page.locator('#download-all');
    
    // Display elements
    this.imageList = page.locator('#image-list');
    this.statsSection = page.locator('#stats');
    this.totalCount = page.locator('#total-count');
    this.originalSize = page.locator('#original-size');
    this.compressedSize = page.locator('#compressed-size');
    this.compressionRatio = page.locator('#compression-ratio');
    
    // Loading element
    this.loading = page.locator('#loading');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async setQuality(value: string) {
    await this.qualitySlider.fill(value);
  }

  async getQuality(): Promise<string> {
    return await this.qualitySlider.inputValue();
  }

  async getQualityDisplayValue(): Promise<string> {
    return await this.qualityValue.textContent() || '';
  }

  async setMaxWidth(value: string) {
    await this.maxWidthInput.fill(value);
  }

  async getMaxWidth(): Promise<string> {
    return await this.maxWidthInput.inputValue();
  }

  async resetSize() {
    await this.resetSizeButton.click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
    await this.page.waitForTimeout(100); // Wait for theme transition
  }

  async selectFiles() {
    await this.fileSelectButton.click();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }

  async downloadAll() {
    await this.downloadAllButton.click();
  }

  async waitForProgressToAppear() {
    await expect(this.progressSection).toBeVisible();
  }

  async waitForProgressToComplete() {
    await expect(this.progressSection).toBeHidden({ timeout: 30000 });
  }

  async getProgressInfo() {
    return {
      current: await this.progressCurrent.textContent(),
      total: await this.progressTotal.textContent(),
      percent: await this.progressPercent.textContent()
    };
  }

  async getStats() {
    return {
      totalCount: await this.totalCount.textContent(),
      originalSize: await this.originalSize.textContent(),
      compressedSize: await this.compressedSize.textContent(),
      compressionRatio: await this.compressionRatio.textContent()
    };
  }

  async isLoadingVisible(): Promise<boolean> {
    return await this.loading.isVisible();
  }

  async isActionsVisible(): Promise<boolean> {
    return await this.actionsSection.isVisible();
  }

  async isStatsVisible(): Promise<boolean> {
    return await this.statsSection.isVisible();
  }

  // Utility methods for assertions
  async expectPageLoaded() {
    await expect(this.page).toHaveTitle('图片压缩工具');
    await expect(this.title).toHaveText('图片压缩工具');
    await expect(this.themeToggle).toBeVisible();
    await expect(this.qualitySlider).toBeVisible();
    await expect(this.maxWidthInput).toBeVisible();
    await expect(this.uploadArea).toBeVisible();
  }

  async expectInitialState() {
    await expect(this.qualitySlider).toHaveValue('0.8');
    await expect(this.qualityValue).toHaveText('0.8');
    await expect(this.maxWidthInput).toHaveValue('2000');
    await expect(this.progressSection).toBeHidden();
    await expect(this.actionsSection).toBeHidden();
    await expect(this.statsSection).toBeHidden();
  }

  async expectQualityValue(expectedValue: string) {
    await expect(this.qualitySlider).toHaveValue(expectedValue);
    await expect(this.qualityValue).toHaveText(expectedValue);
  }

  async expectMaxWidthValue(expectedValue: string) {
    await expect(this.maxWidthInput).toHaveValue(expectedValue);
  }

  // Accessibility helpers
  async checkBasicAccessibility() {
    // Check labels
    await expect(this.page.locator('label[for="quality-slider"]')).toHaveText('压缩质量:');
    await expect(this.page.locator('label[for="max-width"]')).toHaveText('最大宽度 (px):');
    
    // Check button accessibility
    await expect(this.themeToggle).toHaveAttribute('title');
    
    // Check file input
    await expect(this.fileInput).toHaveAttribute('accept', 'image/*');
    await expect(this.fileInput).toHaveAttribute('multiple');
  }

  // Error monitoring
  async monitorConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    this.page.on('pageerror', exception => {
      errors.push(`未捕获异常: ${exception.toString()}`);
    });
    
    return errors;
  }

  // Performance helpers
  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.goto();
    return Date.now() - startTime;
  }

  async checkJSZipLoaded(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return typeof window.JSZip !== 'undefined';
    });
  }
}