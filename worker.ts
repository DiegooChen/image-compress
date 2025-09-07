// worker.ts - Web Worker for image processing

interface ImageProcessingTask {
  id: string;
  file: File;
  quality: number;
  maxWidth: number;
  outputFormat?: string;
}

interface ImageProcessingResult {
  id: string;
  success: boolean;
  originalSize: number;
  compressedSize: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  compressedBlob?: Blob;
  originalDataUrl?: string;
  compressedDataUrl?: string;
  error?: string;
  compressionRatio: number;
}

// EXIF orientation constants
const EXIF_ORIENTATIONS = {
  1: 0,      // normal
  2: 0,      // flip horizontal
  3: 180,    // rotate 180
  4: 180,    // flip vertical
  5: 90,     // transpose
  6: 90,     // rotate 90
  7: -90,    // transverse
  8: -90     // rotate -90
};

// Extract EXIF orientation from image
function getExifOrientation(arrayBuffer: ArrayBuffer): number {
  try {
    const dataView = new DataView(arrayBuffer);
    
    // Check if it's a JPEG file
    if (dataView.byteLength < 4 || dataView.getUint16(0) !== 0xFFD8) return 1;
    
    let offset = 2;
    
    while (offset < dataView.byteLength - 4) {
      // Check bounds before reading marker
      if (offset + 2 > dataView.byteLength) break;
      const marker = dataView.getUint16(offset);
      
      if (marker === 0xFFE1) { // APP1 marker (EXIF)
        // Check segment length bounds
        if (offset + 4 > dataView.byteLength) break;
        const segmentLength = dataView.getUint16(offset + 2);
        if (offset + segmentLength > dataView.byteLength) break;
        
        const exifOffset = offset + 4;
        
        // Check EXIF header bounds
        if (exifOffset + 10 > dataView.byteLength) break;
        if (dataView.getUint32(exifOffset) === 0x45786966) { // "Exif"
          const tiffOffset = exifOffset + 6;
          
          // Check TIFF header bounds
          if (tiffOffset + 8 > dataView.byteLength) break;
          const isLittleEndian = dataView.getUint16(tiffOffset) === 0x4949;
          
          const ifdOffset = dataView.getUint32(tiffOffset + 4, isLittleEndian) + tiffOffset;
          
          // Check IFD bounds
          if (ifdOffset + 2 > dataView.byteLength) break;
          const numEntries = dataView.getUint16(ifdOffset, isLittleEndian);
          
          // Validate numEntries to prevent excessive processing
          if (numEntries > 1000) break;
          
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);
            
            // Check entry bounds
            if (entryOffset + 12 > dataView.byteLength) break;
            const tag = dataView.getUint16(entryOffset, isLittleEndian);
            
            if (tag === 0x0112) { // Orientation tag
              const orientation = dataView.getUint16(entryOffset + 8, isLittleEndian);
              return (orientation >= 1 && orientation <= 8) ? orientation : 1;
            }
          }
        }
      }
      
      // Move to next segment
      if (offset + 4 > dataView.byteLength) break;
      const segmentLength = dataView.getUint16(offset + 2);
      offset += 2 + segmentLength;
      
      // Prevent infinite loops
      if (segmentLength === 0) break;
    }
  } catch (error) {
    console.warn('EXIF orientation parsing failed:', error);
  }
  
  return 1; // Default orientation
}

// Apply rotation to canvas based on EXIF orientation
function applyOrientation(canvas: OffscreenCanvas, ctx: OffscreenCanvasRenderingContext2D, orientation: number) {
  const { width, height } = canvas;
  
  switch (orientation) {
    case 2: // flip horizontal
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3: // rotate 180°
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4: // flip vertical
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5: // transpose
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6: // rotate 90°
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7: // transverse
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8: // rotate -90°
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
  }
}

// Calculate new dimensions while maintaining aspect ratio
function calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number): { width: number; height: number } {
  if (maxWidth <= 0 || (originalWidth <= maxWidth && originalHeight <= maxWidth)) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio)
    };
  } else {
    return {
      width: Math.round(maxWidth * aspectRatio),
      height: maxWidth
    };
  }
}

// Process a single image
async function processImage(task: ImageProcessingTask): Promise<ImageProcessingResult> {
  let imageBitmap: ImageBitmap | null = null;
  
  try {
    const { id, file, quality, maxWidth, outputFormat = 'image/jpeg' } = task;
    
    // Validate file size (limit to ~50MB to prevent memory issues)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件大小超出限制（最大50MB）');
    }
    
    // Read file as array buffer for EXIF
    const arrayBuffer = await file.arrayBuffer();
    const orientation = getExifOrientation(arrayBuffer);
    
    // Create image from file with error handling
    try {
      imageBitmap = await createImageBitmap(file);
    } catch (bitmapError) {
      throw new Error('无法创建图像位图，可能文件已损坏');
    }
    
    const { width: originalWidth, height: originalHeight } = imageBitmap;
    
    // Validate image dimensions
    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new Error('无效的图像尺寸');
    }
    
    // Check for extremely large images that might cause memory issues
    if (originalWidth * originalHeight > 50000000) { // ~50MP
      console.warn('Processing very large image:', originalWidth, 'x', originalHeight);
    }
    
    // Calculate new dimensions
    const { width: newWidth, height: newHeight } = calculateDimensions(originalWidth, originalHeight, maxWidth);
    
    // Validate new dimensions
    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error('计算的新尺寸无效');
    }
    
    // Create canvas for processing
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建canvas context');
    }
    
    // Apply EXIF orientation if needed
    if (orientation > 1) {
      try {
        applyOrientation(canvas, ctx, orientation);
      } catch (orientationError) {
        console.warn('EXIF orientation application failed, using default:', orientationError);
      }
    }
    
    // Draw and resize image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    try {
      ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
    } catch (drawError) {
      throw new Error('图像绘制失败：' + (drawError instanceof Error ? drawError.message : String(drawError)));
    }
    
    // Convert to blob
    let compressedBlob: Blob;
    try {
      compressedBlob = await canvas.convertToBlob({
        type: outputFormat,
        quality: outputFormat.includes('jpeg') ? quality : undefined
      });
    } catch (convertError) {
      throw new Error('图像转换失败：' + (convertError instanceof Error ? convertError.message : String(convertError)));
    }
    
    // Create data URLs for preview with size limits
    const originalDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取原始文件失败'));
      reader.readAsDataURL(file);
    });
    
    const compressedDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取压缩文件失败'));
      reader.readAsDataURL(compressedBlob);
    });
    
    const originalSize = file.size;
    const compressedSize = compressedBlob.size;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
    
    return {
      id,
      success: true,
      originalSize,
      compressedSize,
      originalDimensions: { width: originalWidth, height: originalHeight },
      compressedDimensions: { width: newWidth, height: newHeight },
      compressedBlob,
      originalDataUrl,
      compressedDataUrl,
      compressionRatio
    };
    
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      id: task.id,
      success: false,
      originalSize: task.file.size,
      compressedSize: 0,
      originalDimensions: { width: 0, height: 0 },
      compressedDimensions: { width: 0, height: 0 },
      compressionRatio: 0,
      error: error instanceof Error ? error.message : '未知错误'
    };
  } finally {
    // Clean up resources
    if (imageBitmap) {
      imageBitmap.close();
    }
  }
}

// Worker message handler
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PROCESS_IMAGE':
      const result = await processImage(data as ImageProcessingTask);
      self.postMessage({
        type: 'IMAGE_PROCESSED',
        data: result
      });
      break;
      
    case 'PROCESS_BATCH':
      const tasks = data as ImageProcessingTask[];
      const results: ImageProcessingResult[] = [];
      
      for (let i = 0; i < tasks.length; i++) {
        const result = await processImage(tasks[i]);
        results.push(result);
        
        // Send progress update
        self.postMessage({
          type: 'BATCH_PROGRESS',
          data: {
            current: i + 1,
            total: tasks.length,
            result
          }
        });
      }
      
      self.postMessage({
        type: 'BATCH_COMPLETED',
        data: results
      });
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        data: { error: `未知消息类型: ${type}` }
      });
  }
});

// Export type definitions for main thread
export type { ImageProcessingTask, ImageProcessingResult };