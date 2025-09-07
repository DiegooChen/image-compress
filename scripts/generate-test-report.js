#!/usr/bin/env node

/**
 * 测试报告生成器
 * 汇总所有测试结果并生成综合报告
 */

const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.reportDir = path.join(process.cwd(), 'test-reports');
    this.ensureReportDir();
  }

  ensureReportDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generateReport() {
    console.log('🔄 开始生成测试报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coverage: null,
        performance: null,
        accessibility: null
      },
      details: {
        unit: await this.getUnitTestResults(),
        e2e: await this.getE2EResults(),
        performance: await this.getPerformanceResults(),
        accessibility: await this.getAccessibilityResults()
      }
    };

    // 计算总览统计
    this.calculateSummary(report);
    
    // 生成 HTML 报告
    await this.generateHTMLReport(report);
    
    // 生成 JSON 报告
    await this.generateJSONReport(report);
    
    // 生成 Markdown 报告
    await this.generateMarkdownReport(report);
    
    console.log('✅ 测试报告生成完成！');
    console.log(`📁 报告目录: ${this.reportDir}`);
  }

  async getUnitTestResults() {
    const jestResultsPath = path.join(process.cwd(), 'coverage/coverage-summary.json');
    
    if (fs.existsSync(jestResultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
        return {
          status: 'completed',
          coverage: results.total || null,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return { status: 'error', error: error.message };
      }
    }
    
    return { status: 'not-run', message: '单元测试未运行或结果文件不存在' };
  }

  async getE2EResults() {
    const playwrightResultsPath = path.join(process.cwd(), 'playwright-report');
    
    if (fs.existsSync(playwrightResultsPath)) {
      return {
        status: 'completed',
        reportPath: playwrightResultsPath,
        timestamp: new Date().toISOString()
      };
    }
    
    return { status: 'not-run', message: 'E2E测试未运行或结果文件不存在' };
  }

  async getPerformanceResults() {
    const lighthousePath = path.join(process.cwd(), '.lighthouseci');
    
    if (fs.existsSync(lighthousePath)) {
      return {
        status: 'completed',
        reportPath: lighthousePath,
        timestamp: new Date().toISOString()
      };
    }
    
    return { status: 'not-run', message: 'Lighthouse测试未运行或结果文件不存在' };
  }

  async getAccessibilityResults() {
    // 无障碍性测试结果通常包含在 E2E 测试结果中
    return {
      status: 'included-in-e2e',
      message: '无障碍性测试结果包含在E2E测试报告中'
    };
  }

  calculateSummary(report) {
    // 基于实际结果计算统计信息
    if (report.details.unit.coverage) {
      report.summary.coverage = {
        statements: report.details.unit.coverage.statements?.pct || 0,
        branches: report.details.unit.coverage.branches?.pct || 0,
        functions: report.details.unit.coverage.functions?.pct || 0,
        lines: report.details.unit.coverage.lines?.pct || 0
      };
    }
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告 - Image Compress</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .title { color: #2c3e50; margin-bottom: 10px; }
        .subtitle { color: #7f8c8d; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h3 { color: #2c3e50; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .status { padding: 5px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500; }
        .status.completed { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.not-run { background: #fff3cd; color: #856404; }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.high { background: #28a745; }
        .progress-fill.medium { background: #ffc107; }
        .progress-fill.low { background: #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🧪 Image Compress 测试报告</h1>
            <p class="subtitle">生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
        </div>

        <div class="grid">
            <!-- 单元测试 -->
            <div class="card">
                <h3>📝 单元测试 <span class="status ${report.details.unit.status}">${this.getStatusText(report.details.unit.status)}</span></h3>
                ${report.summary.coverage ? `
                <div class="metric">
                    <span>语句覆盖率</span>
                    <span>${report.summary.coverage.statements}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(report.summary.coverage.statements)}" style="width: ${report.summary.coverage.statements}%"></div>
                </div>
                <div class="metric">
                    <span>分支覆盖率</span>
                    <span>${report.summary.coverage.branches}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(report.summary.coverage.branches)}" style="width: ${report.summary.coverage.branches}%"></div>
                </div>
                <div class="metric">
                    <span>函数覆盖率</span>
                    <span>${report.summary.coverage.functions}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(report.summary.coverage.functions)}" style="width: ${report.summary.coverage.functions}%"></div>
                </div>
                <div class="metric">
                    <span>行覆盖率</span>
                    <span>${report.summary.coverage.lines}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(report.summary.coverage.lines)}" style="width: ${report.summary.coverage.lines}%"></div>
                </div>
                ` : '<p>未找到覆盖率数据</p>'}
            </div>

            <!-- E2E测试 -->
            <div class="card">
                <h3>🎭 端到端测试 <span class="status ${report.details.e2e.status}">${this.getStatusText(report.details.e2e.status)}</span></h3>
                ${report.details.e2e.reportPath ? 
                  `<p>📊 详细报告: <a href="${report.details.e2e.reportPath}" target="_blank">查看Playwright报告</a></p>` : 
                  '<p>无可用报告</p>'
                }
            </div>

            <!-- 性能测试 -->
            <div class="card">
                <h3>🚀 性能测试 <span class="status ${report.details.performance.status}">${this.getStatusText(report.details.performance.status)}</span></h3>
                ${report.details.performance.reportPath ? 
                  `<p>📊 详细报告: <a href="${report.details.performance.reportPath}" target="_blank">查看Lighthouse报告</a></p>` : 
                  '<p>无可用报告</p>'
                }
            </div>

            <!-- 无障碍性测试 -->
            <div class="card">
                <h3>♿ 无障碍性测试 <span class="status ${report.details.accessibility.status}">${this.getStatusText(report.details.accessibility.status)}</span></h3>
                <p>${report.details.accessibility.message}</p>
            </div>
        </div>

        <div class="timestamp">
            报告生成于: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'index.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML报告已生成: ${htmlPath}`);
  }

  async generateJSONReport(report) {
    const jsonPath = path.join(this.reportDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON报告已生成: ${jsonPath}`);
  }

  async generateMarkdownReport(report) {
    const md = `# 🧪 Image Compress 测试报告

**生成时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}

## 📊 测试概览

| 测试类型 | 状态 | 详情 |
|---------|------|------|
| 📝 单元测试 | ${this.getStatusEmoji(report.details.unit.status)} ${this.getStatusText(report.details.unit.status)} | ${report.summary.coverage ? '覆盖率数据可用' : '无覆盖率数据'} |
| 🎭 E2E测试 | ${this.getStatusEmoji(report.details.e2e.status)} ${this.getStatusText(report.details.e2e.status)} | ${report.details.e2e.reportPath ? 'Playwright报告可用' : '无报告'} |
| 🚀 性能测试 | ${this.getStatusEmoji(report.details.performance.status)} ${this.getStatusText(report.details.performance.status)} | ${report.details.performance.reportPath ? 'Lighthouse报告可用' : '无报告'} |
| ♿ 无障碍性 | ${this.getStatusEmoji(report.details.accessibility.status)} ${this.getStatusText(report.details.accessibility.status)} | ${report.details.accessibility.message} |

${report.summary.coverage ? `
## 📝 单元测试覆盖率

- **语句覆盖率**: ${report.summary.coverage.statements}%
- **分支覆盖率**: ${report.summary.coverage.branches}%
- **函数覆盖率**: ${report.summary.coverage.functions}%
- **行覆盖率**: ${report.summary.coverage.lines}%
` : ''}

## 🔗 报告链接

- [📊 完整HTML报告](./index.html)
- [📄 JSON数据](./report.json)
${report.details.e2e.reportPath ? `- [🎭 Playwright E2E报告](${report.details.e2e.reportPath})` : ''}
${report.details.performance.reportPath ? `- [🚀 Lighthouse性能报告](${report.details.performance.reportPath})` : ''}

---
*报告由测试自动化系统生成*`;

    const mdPath = path.join(this.reportDir, 'README.md');
    fs.writeFileSync(mdPath, md);
    console.log(`📄 Markdown报告已生成: ${mdPath}`);
  }

  getStatusText(status) {
    const statusMap = {
      'completed': '已完成',
      'error': '错误',
      'not-run': '未运行',
      'included-in-e2e': '已包含'
    };
    return statusMap[status] || status;
  }

  getStatusEmoji(status) {
    const emojiMap = {
      'completed': '✅',
      'error': '❌',
      'not-run': '⏳',
      'included-in-e2e': '✅'
    };
    return emojiMap[status] || '❓';
  }

  getCoverageClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }
}

// 运行报告生成器
async function main() {
  try {
    const generator = new TestReportGenerator();
    await generator.generateReport();
  } catch (error) {
    console.error('❌ 生成测试报告时出错:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestReportGenerator;