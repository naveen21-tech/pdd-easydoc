const path = require('path');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  browser: process.env.BROWSER || 'chrome', // chrome | firefox | edge
  headless: process.env.HEADLESS !== 'false', // default true in CI
  implicitWait: parseInt(process.env.IMPLICIT_WAIT || '10000', 10),
  explicitWait: parseInt(process.env.EXPLICIT_WAIT || '15000', 10),
  retryCount: parseInt(process.env.RETRY_COUNT || '2', 10),
  
  appium: {
    host: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    platformName: 'Android',
    automationName: 'UiAutomator2',
    flutterDriverPreferred: true,
    appPackage: process.env.APP_PACKAGE || 'com.easydoc.app',
    appActivity: process.env.APP_ACTIVITY || 'com.easydoc.app.MainActivity',
    apkPath: process.env.APK_PATH || path.join(rootDir, 'app', 'app-release.apk')
  },

  paths: {
    reports: path.join(rootDir, 'reports'),
    failures: path.join(rootDir, 'reports', 'failures'),
    screenshots: path.join(rootDir, 'screenshots'),
    logs: path.join(rootDir, 'logs'),
    excel: path.join(rootDir, 'reports', 'excel'),
    html: path.join(rootDir, 'reports', 'mochawesome')
  }
};
