// script.ts - Main application logic

import type { ImageProcessingTask, ImageProcessingResult } from './worker';

declare const JSZip: any;

interface ImageItem {
  id: string;
  file: File;
  originalDataUrl: string;
  compressedDataUrl?: string;
  compressedBlob?: Blob;
  originalSize: number;
  compressedSize?: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions?: { width: number; height: number };
  compressionRatio?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

class ImageCompressor {
  private worker!: Worker;
  private images: Map<string, ImageItem> = new Map();
  private currentTheme: 'light' | 'dark' = 'light';
  
  // DOM elements
  private elements = {
    themeToggle: document.getElementById('theme-toggle') as HTMLButtonElement,
    qualitySlider: document.getElementById('quality-slider') as HTMLInputElement,
    qualityValue: document.getElementById('quality-value') as HTMLSpanElement,
    maxWidthInput: document.getElementById('max-width') as HTMLInputElement,
    resetSizeBtn: document.getElementById('reset-size') as HTMLButtonElement,
    uploadArea: document.getElementById('upload-area') as HTMLDivElement,
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    fileSelectBtn: document.getElementById('file-select') as HTMLButtonElement,
    progressSection: document.getElementById('progress-section') as HTMLDivElement,
    progressFill: document.getElementById('progress-fill') as HTMLDivElement,
    progressCurrent: document.getElementById('progress-current') as HTMLSpanElement,
    progressTotal: document.getElementById('progress-total') as HTMLSpanElement,
    progressPercent: document.getElementById('progress-percent') as HTMLSpanElement,
    actions: document.getElementById('actions') as HTMLDivElement,
    clearAllBtn: document.getElementById('clear-all') as HTMLButtonElement,
    downloadAllBtn: document.getElementById('download-all') as HTMLButtonElement,
    imageList: document.getElementById('image-list') as HTMLDivElement,
    stats: document.getElementById('stats') as HTMLDivElement,
    totalCount: document.getElementById('total-count') as HTMLSpanElement,
    originalSize: document.getElementById('original-size') as HTMLSpanElement,
    compressedSize: document.getElementById('compressed-size') as HTMLSpanElement,
    compressionRatio: document.getElementById('compression-ratio') as HTMLSpanElement,
    loading: document.getElementById('loading') as HTMLDivElement,
  };

  constructor() {
    this.initializeWorker();
    this.setupEventListeners();
    this.initializeTheme();
  }

  private initializeWorker() {
    this.worker = new Worker(`./dist/worker.js?v=${Date.now()}`);
    this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
  }

  private setupEventListeners() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    
    // Quality slider
    this.elements.qualitySlider.addEventListener('input', this.updateQualityValue.bind(this));
    
    // Reset size button
    this.elements.resetSizeBtn.addEventListener('click', () => {
      this.elements.maxWidthInput.value = '2000';
    });
    
    // File selection
    this.elements.fileSelectBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });
    
    this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    
    // Drag and drop
    this.setupDragAndDrop();
    
    // Action buttons
    this.elements.clearAllBtn.addEventListener('click', this.clearAll.bind(this));
    this.elements.downloadAllBtn.addEventListener('click', this.downloadAll.bind(this));
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    this.setTheme(savedTheme);
  }

  private toggleTheme() {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  private setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = this.elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'light' ? '🌓' : '☀️';
    }
  }

  private updateQualityValue() {
    this.elements.qualityValue.textContent = this.elements.qualitySlider.value;
  }

  private setupDragAndDrop() {
    const uploadArea = this.elements.uploadArea;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, this.preventDefaults.bind(this), false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('drag-over');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('drag-over');
      }, false);
    });
    
    uploadArea.addEventListener('drop', this.handleDrop.bind(this), false);
  }

  private preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleDrop(e: DragEvent) {
    const dt = e.dataTransfer;
    const files = dt?.files;
    
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  private handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  private async handleFiles(files: File[]) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('请选择有效的图片文件');
      return;
    }

    // Create image items
    const newImages: ImageItem[] = [];
    for (const file of imageFiles) {
      const id = this.generateId();
      const originalDataUrl = await this.fileToDataUrl(file);
      const dimensions = await this.getImageDimensions(originalDataUrl);
      
      const imageItem: ImageItem = {
        id,
        file,
        originalDataUrl,
        originalSize: file.size,
        originalDimensions: dimensions,
        status: 'pending'
      };
      
      this.images.set(id, imageItem);
      newImages.push(imageItem);
    }

    this.renderImages();
    this.showSections();
    this.processImages(newImages);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = dataUrl;
    });
  }

  private async processImages(images: ImageItem[]) {
    const quality = parseFloat(this.elements.qualitySlider.value);
    const maxWidth = parseInt(this.elements.maxWidthInput.value) || 0;
    
    // Update progress
    this.updateProgress(0, images.length);
    
    // Create tasks
    const tasks: ImageProcessingTask[] = images.map(image => ({
      id: image.id,
      file: image.file,
      quality,
      maxWidth
    }));

    // Set images to processing state
    images.forEach(image => {
      image.status = 'processing';
    });
    
    this.renderImages();

    // Send to worker
    this.worker.postMessage({
      type: 'PROCESS_BATCH',
      data: tasks
    });
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'BATCH_PROGRESS':
        this.handleBatchProgress(data);
        break;
      case 'BATCH_COMPLETED':
        this.handleBatchCompleted();
        break;
      case 'ERROR':
        console.error('Worker error:', data.error);
        break;
    }
  }

  private handleBatchProgress(data: { current: number; total: number; result: ImageProcessingResult }) {
    const { current, total, result } = data;
    const image = this.images.get(result.id);
    
    if (image) {
      if (result.success) {
        image.compressedDataUrl = result.compressedDataUrl;
        image.compressedBlob = result.compressedBlob;
        image.compressedSize = result.compressedSize;
        image.compressedDimensions = result.compressedDimensions;
        image.compressionRatio = result.compressionRatio;
        image.status = 'completed';
      } else {
        image.error = result.error;
        image.status = 'error';
      }
    }
    
    this.updateProgress(current, total);
    this.renderImages();
    this.updateStats();
  }

  private handleBatchCompleted() {
    setTimeout(() => {
      this.elements.progressSection.style.display = 'none';
    }, 1000);
  }

  private updateProgress(current: number, total: number) {
    const percent = Math.round((current / total) * 100);
    
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressCurrent.textContent = current.toString();
    this.elements.progressTotal.textContent = total.toString();
    this.elements.progressPercent.textContent = `${percent}%`;
  }

  private showSections() {
    this.elements.progressSection.style.display = 'block';
    this.elements.actions.style.display = 'flex';
    this.elements.stats.style.display = 'block';
  }

  private renderImages() {
    this.elements.imageList.innerHTML = '';
    
    this.images.forEach(image => {
      const imageElement = this.createImageElement(image);
      this.elements.imageList.appendChild(imageElement);
    });
  }

  private createImageElement(image: ImageItem): HTMLElement {
    const div = document.createElement('div');
    div.className = `image-item fade-in ${image.status}`;
    
    const originalPreview = this.createPreviewElement('原图', image.originalDataUrl, image.originalDimensions);
    const compressedPreview = this.createPreviewElement('压缩后', image.compressedDataUrl, image.compressedDimensions);
    
    const info = document.createElement('div');
    info.className = 'image-info';
    info.innerHTML = `
      <div class="info-row">
        <span class="info-label">文件名:</span>
        <span class="info-value">${image.file.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">原始大小:</span>
        <span class="info-value">${this.formatFileSize(image.originalSize)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">压缩后大小:</span>
        <span class="info-value">${image.compressedSize ? this.formatFileSize(image.compressedSize) : '处理中...'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">压缩率:</span>
        <span class="info-value compression-ratio">${image.compressionRatio ? image.compressionRatio + '%' : '-'}</span>
      </div>
      ${image.error ? `<div class="info-row"><span class="info-label">错误:</span><span class="info-value" style="color: var(--error-color);">${image.error}</span></div>` : ''}
    `;
    
    div.appendChild(originalPreview);
    div.appendChild(compressedPreview);
    div.appendChild(info);
    
    if (image.status === 'completed' && image.compressedBlob) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn-primary download-btn';
      downloadBtn.textContent = '下载';
      downloadBtn.addEventListener('click', () => this.downloadSingle(image));
      div.appendChild(downloadBtn);
    }
    
    return div;
  }

  private createPreviewElement(title: string, dataUrl?: string, dimensions?: { width: number; height: number }): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    preview.appendChild(titleElement);
    
    if (dataUrl) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = title;
      preview.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width: 150px; height: 150px; background: var(--bg-tertiary); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center; color: var(--text-secondary);';
      placeholder.textContent = '处理中...';
      preview.appendChild(placeholder);
    }
    
    if (dimensions) {
      const dimensionsElement = document.createElement('div');
      dimensionsElement.className = 'image-dimensions';
      dimensionsElement.textContent = `${dimensions.width} × ${dimensions.height}`;
      dimensionsElement.style.cssText = 'font-size: 0.9rem; color: var(--text-secondary); margin-top: 5px;';
      preview.appendChild(dimensionsElement);
    }
    
    return preview;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private updateStats() {
    const images = Array.from(this.images.values());
    const completed = images.filter(img => img.status === 'completed');
    
    const totalCount = images.length;
    const originalTotalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const compressedTotalSize = completed.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
    const overallCompressionRatio = originalTotalSize > 0 
      ? Math.round((1 - compressedTotalSize / originalTotalSize) * 100) 
      : 0;
    
    this.elements.totalCount.textContent = totalCount.toString();
    this.elements.originalSize.textContent = this.formatFileSize(originalTotalSize);
    this.elements.compressedSize.textContent = this.formatFileSize(compressedTotalSize);
    this.elements.compressionRatio.textContent = overallCompressionRatio + '%';
  }

  private clearAll() {
    this.images.clear();
    this.renderImages();
    this.updateStats();
    this.elements.progressSection.style.display = 'none';
    this.elements.actions.style.display = 'none';
    this.elements.stats.style.display = 'none';
    this.elements.fileInput.value = '';
  }

  private downloadSingle(image: ImageItem) {
    if (!image.compressedBlob) return;
    
    const url = URL.createObjectURL(image.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${image.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async downloadAll() {
    const completedImages = Array.from(this.images.values()).filter(img => img.status === 'completed' && img.compressedBlob);
    
    if (completedImages.length === 0) {
      alert('没有可下载的图片');
      return;
    }

    this.elements.loading.style.display = 'flex';
    
    try {
      const zip = new JSZip();
      
      completedImages.forEach(image => {
        if (image.compressedBlob) {
          zip.file(`compressed_${image.file.name}`, image.compressedBlob);
        }
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_images_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('压缩下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      this.elements.loading.style.display = 'none';
    }
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ImageCompressor());
} else {
  new ImageCompressor();
}