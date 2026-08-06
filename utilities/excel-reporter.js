const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const config = require('../config/framework.config');
const logger = require('./logger');

class ExcelReporter {
  static async generateReport(suiteName, summaryData, testCases, failedTests, executionLogs, filename) {
    if (!fs.existsSync(config.paths.excel)) {
      fs.mkdirSync(config.paths.excel, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Enterprise QA Architecture';
    workbook.created = new Date();

    // -------------------------------------------------------------
    // Sheet 1: Summary
    // -------------------------------------------------------------
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Execution Date', key: 'execDate', width: 22 },
      { header: 'Environment', key: 'environment', width: 18 },
      { header: 'Total Tests', key: 'total', width: 14 },
      { header: 'Passed', key: 'passed', width: 14 },
      { header: 'Failed', key: 'failed', width: 14 },
      { header: 'Skipped', key: 'skipped', width: 14 },
      { header: 'Pass Percentage', key: 'passRate', width: 18 },
      { header: 'Execution Duration', key: 'duration', width: 20 }
    ];

    // Format Header Row
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' } // Dark blue
    };

    summarySheet.addRow({
      execDate: summaryData.execDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
      environment: summaryData.environment || 'Production CI/CD',
      total: summaryData.total || testCases.length,
      passed: summaryData.passed || testCases.filter(t => t.status === 'PASSED').length,
      failed: summaryData.failed || testCases.filter(t => t.status === 'FAILED').length,
      skipped: summaryData.skipped || testCases.filter(t => t.status === 'SKIPPED').length,
      passRate: summaryData.passRate || `${((summaryData.passed / summaryData.total) * 100).toFixed(2)}%`,
      duration: summaryData.duration || '00:01:45'
    });

    // -------------------------------------------------------------
    // Sheet 2: Test Cases
    // -------------------------------------------------------------
    const testSheet = workbook.addWorksheet('Test Cases');
    testSheet.columns = [
      { header: 'Test ID', key: 'id', width: 15 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Scenario Name', key: 'scenario', width: 45 },
      { header: 'Browser / Engine', key: 'engine', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Start Time', key: 'startTime', width: 22 },
      { header: 'End Time', key: 'endTime', width: 22 },
      { header: 'Duration', key: 'duration', width: 14 }
    ];

    testSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    testSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F766E' } // Teal
    };

    testCases.forEach((tc) => {
      const row = testSheet.addRow(tc);
      const statusCell = row.getCell('status');
      if (tc.status === 'PASSED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Light green
        statusCell.font = { color: { argb: '166534' }, bold: true };
      } else if (tc.status === 'FAILED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Light red
        statusCell.font = { color: { argb: '991B1B' }, bold: true };
      }
    });

    // -------------------------------------------------------------
    // Sheet 3: Failed Tests
    // -------------------------------------------------------------
    const failedSheet = workbook.addWorksheet('Failed Tests');
    failedSheet.columns = [
      { header: 'Test Name', key: 'name', width: 35 },
      { header: 'Failure Reason', key: 'reason', width: 45 },
      { header: 'Screenshot Path', key: 'screenshot', width: 35 },
      { header: 'Browser / Device', key: 'device', width: 20 },
      { header: 'URL / Activity', key: 'url', width: 30 }
    ];

    failedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    failedSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'B91C1C' } // Red
    };

    (failedTests || []).forEach((ft) => {
      failedSheet.addRow(ft);
    });

    // -------------------------------------------------------------
    // Sheet 4: Execution Logs
    // -------------------------------------------------------------
    const logSheet = workbook.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 22 },
      { header: 'Test Name', key: 'testName', width: 35 },
      { header: 'Step Description', key: 'step', width: 50 },
      { header: 'Result', key: 'result', width: 14 },
      { header: 'Remarks', key: 'remarks', width: 35 }
    ];

    logSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    logSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '374151' } // Dark gray
    };

    (executionLogs || []).forEach((el) => {
      logSheet.addRow(el);
    });

    const targetPath = path.join(config.paths.excel, filename || `${suiteName}_Report.xlsx`);
    await workbook.xlsx.writeFile(targetPath);
    logger.info(`[ExcelReporter] Successfully generated report: ${targetPath}`);
    return targetPath;
  }
}

module.exports = ExcelReporter;
