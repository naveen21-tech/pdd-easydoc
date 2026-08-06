const fs = require('fs');
const path = require('path');
const config = require('../config/framework.config');
const logger = require('./logger');

class FailureHandler {
  static async handleFailure(driver, testName, error) {
    if (!fs.existsSync(config.paths.failures)) {
      fs.mkdirSync(config.paths.failures, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTestName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const screenshotFileName = `${sanitizedTestName}_${timestamp}.png`;
    const screenshotPath = path.join(config.paths.failures, screenshotFileName);

    let currentUrl = 'N/A';
    let consoleLogs = [];

    if (driver && typeof driver.takeScreenshot === 'function') {
      try {
        const image = await driver.takeScreenshot();
        fs.writeFileSync(screenshotPath, image, 'base64');
        logger.info(`[FailureHandler] Screenshot saved to ${screenshotPath}`);
      } catch (err) {
        logger.error(`[FailureHandler] Failed to capture screenshot: ${err.message}`);
      }

      try {
        if (typeof driver.getCurrentUrl === 'function') {
          currentUrl = await driver.getCurrentUrl();
        }
      } catch (err) {
        currentUrl = 'Unable to fetch URL';
      }

      try {
        if (driver.manage && typeof driver.manage().logs === 'function') {
          consoleLogs = await driver.manage().logs().get('browser');
        }
      } catch (err) {
        consoleLogs = ['Console logs unavailable'];
      }
    }

    const failureRecord = {
      testName,
      timestamp: new Date().toISOString(),
      failureReason: error.message || String(error),
      stackTrace: error.stack || 'No stack trace available',
      currentUrl,
      screenshotPath,
      consoleLogs
    };

    const detailsPath = path.join(config.paths.failures, `${sanitizedTestName}_${timestamp}.json`);
    fs.writeFileSync(detailsPath, JSON.stringify(failureRecord, null, 2));

    logger.error(`[FailureHandler] Recorded failure details for test '${testName}' at ${detailsPath}`);

    return failureRecord;
  }
}

module.exports = FailureHandler;
