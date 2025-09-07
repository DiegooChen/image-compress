# 图片压缩工具

一个纯前端的图片压缩工具，支持JPEG/PNG/WebP/AVIF格式的质量压缩与等比缩放，具备拖拽上传、批处理、预览对比、统计信息和批量下载功能。

## 功能特性

- ✅ **多格式支持** - 支持 JPEG、PNG、WebP、AVIF 格式
- ✅ **质量压缩** - 可调节压缩质量（0.1-1.0）
- ✅ **尺寸调整** - 支持最大宽度限制，自动等比缩放
- ✅ **EXIF处理** - 自动去除EXIF信息，保留图片方向校正
- ✅ **拖拽上传** - 支持拖拽和文件选择两种上传方式
- ✅ **批量处理** - 可同时处理多张图片
- ✅ **实时预览** - 压缩前后对比预览
- ✅ **统计信息** - 显示原始大小、压缩后大小、压缩率
- ✅ **Web Worker** - 使用Web Worker防止主线程卡顿
- ✅ **主题切换** - 支持深色/浅色主题自动切换
- ✅ **响应式设计** - 兼容桌面和移动端
- ✅ **批量下载** - 支持单张下载和ZIP打包下载

## 技术实现

- **前端框架**: 原生JavaScript + TypeScript
- **图片处理**: Canvas API + OffscreenCanvas
- **多线程**: Web Workers
- **EXIF处理**: 原生JavaScript EXIF解析
- **文件打包**: JSZip
- **样式**: 原生CSS with CSS Variables

## 使用方法

### 方式一：直接使用单文件版本
1. 打开 `standalone.html` 文件
2. 直接在浏览器中使用，无需安装依赖

### 方式二：开发版本
1. 安装依赖：
```bash
npm install
```

2. 编译TypeScript：
```bash
npm run build
```

3. 打开 `index.html` 文件在浏览器中使用

## 项目结构

```
image-compress/
├── standalone.html      # 单文件完整版本
├── index.html          # 模块化版本主页面
├── style.css           # 样式文件
├── script.ts           # 主要逻辑（TypeScript）
├── worker.ts           # Web Worker（TypeScript）
├── dist/               # 编译后的JavaScript文件
│   ├── script.js
│   └── worker.js
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
└── README.md          # 说明文档
```

## 验收测试

✅ **基础功能测试**：
- 拖拽10张4000×3000的JPG图片 ✅
- 设置压缩到2000px宽度，质量0.8 ✅
- 页面无卡死，处理流畅 ✅
- 成功导出压缩后的图片 ✅

✅ **显示信息测试**：
- 每张图片显示原始/压缩后尺寸 ✅
- 显示原始/压缩后文件大小 ✅
- 显示压缩率百分比 ✅

✅ **功能完整性测试**：
- 主题切换正常工作 ✅
- 响应式设计适配移动端 ✅
- 错误处理和进度显示 ✅
- EXIF信息正确处理 ✅

## 浏览器兼容性

- ✅ Chrome 76+
- ✅ Firefox 69+
- ✅ Safari 13+
- ✅ Edge 79+

## 技术亮点

1. **性能优化**：使用Web Worker处理大图，避免主线程阻塞
2. **EXIF处理**：自动解析和应用EXIF方向信息
3. **内存管理**：及时释放ImageBitmap和URL对象
4. **用户体验**：实时进度显示、平滑动画、主题适配
5. **移动端优化**：响应式布局，触摸友好的界面

## 开发说明

- 使用TypeScript提供类型安全
- 模块化设计便于维护
- 提供单文件版本便于分发
- 支持StackBlitz等在线开发环境

## License

MIT License