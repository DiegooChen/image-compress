# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个纯前端的图片压缩工具，使用 TypeScript + Canvas API + Web Workers 实现。支持多格式图片压缩、批量处理、EXIF 处理和响应式设计。

## 核心架构

### 文件结构
- `script.ts` - 主应用逻辑，包含 ImageCompressor 主类
- `worker.ts` - Web Worker 实现，处理图片压缩防止主线程阻塞  
- `utils.ts` - 图片处理工具函数和 EXIF 处理
- `standalone.html` - 完整的单文件版本，包含内联的所有代码
- `index.html` - 模块化版本主页面
- `style.css` - CSS 样式，使用 CSS 变量支持主题切换

### 关键类和接口
- `ImageCompressor` 类：主应用控制器 (script.ts)
- `ImageItem` 接口：图片项数据结构
- `ImageProcessingTask/Result` 接口：Worker 通信接口

### Web Worker 架构
- 图片处理在 Web Worker 中执行，避免 UI 阻塞
- 使用 OffscreenCanvas 进行高性能图片处理
- 支持 JPEG/PNG/WebP/AVIF 格式压缩

## 开发命令

### 构建和编译
```bash
# TypeScript 编译 (监听模式)
npm run dev

# 单次编译
npm run build
```

### 测试
```bash
# 单元测试
npm run test

# 监听模式单元测试
npm run test:watch

# 测试覆盖率
npm run test:coverage

# 端到端测试 (启动本地服务器)
npm run test:e2e

# Lighthouse 性能测试
npm run test:lighthouse

# 运行所有测试
npm run test:all
```

### 本地开发服务器
```bash
# 启动 HTTP 服务器 (端口 9000)
npx http-server -p 9000 -c-1

# 或者使用 Python
python -m http.server 8000
```

## 测试环境配置

### Jest (单元测试)
- 测试环境: jsdom
- 测试文件: `tests/unit/**/*.test.ts`
- 覆盖率: script.ts, worker.ts
- 配置: jest.config.js

### Playwright (E2E测试)
- 基础 URL: http://localhost:9000
- 测试文件: `tests/e2e/**/*.spec.ts`, `tests/performance/**/*.spec.ts`, `tests/accessibility/**/*.spec.ts`
- 浏览器: Chrome, Firefox, Safari
- 配置: playwright.config.ts

## 关键功能模块

### 图片处理流程
1. 文件上传 → 创建 ImageItem
2. Web Worker 处理 → Canvas 压缩
3. EXIF 解析和方向校正
4. 结果返回 → UI 更新

### 主题系统
- CSS 变量控制颜色主题
- localStorage 持久化主题选择
- 自动检测系统偏好

### 批量下载
- 单张下载: Blob URL + 临时 a 标签
- ZIP 打包: JSZip 库处理多文件打包

## 性能要求

根据 TESTING.md 中的验收标准：
- 单张 4000×3000 图片处理: < 3秒
- 批量处理 10张大图: < 30秒，页面无卡顿
- 内存占用: < 500MB
- 压缩率: 60-80% (质量 0.8)

## TypeScript 配置

- 目标: ES2018
- 模块: ES2020
- 输出目录: ./dist/
- 包含 DOM 和 WebWorker 类型支持
- 启用严格模式

## 调试提示

### 查看 Web Worker 日志
在浏览器开发者工具中检查 Worker 线程的 console 输出

### 性能分析
使用 Performance 标签验证主线程空闲时间和 Worker 负载

### EXIF 处理调试
检查 utils.ts 中的 `parseExifOrientation` 和 `applyExifRotation` 函数

## 部署说明

两种使用方式：
1. **开发版本**: 需要编译 TypeScript，使用 index.html
2. **独立版本**: 直接使用 standalone.html，无需编译