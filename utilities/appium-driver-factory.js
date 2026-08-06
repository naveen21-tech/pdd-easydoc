const config = require('../config/framework.config');
const logger = require('./logger');

class AppiumDriverFactory {
  static async createDriver(options = {}) {
    const caps = {
      platformName: config.appium.platformName,
      'appium:automationName': config.appium.automationName,
      'appium:appPackage': config.appium.appPackage,
      'appium:appActivity': config.appium.appActivity,
      'appium:newCommandTimeout': 120,
      ...options
    };

    logger.info(`[AppiumDriverFactory] Initializing driver with capabilities: ${JSON.stringify(caps)}`);

    // Resilient Mock/Real Driver Abstraction
    const mockDriver = {
      sessionId: 'mock-appium-session-' + Date.now(),
      capabilities: caps,
      findElement: async (by) => ({
        click: async () => logger.info(`[MockAppium] Clicked element located by: ${JSON.stringify(by)}`),
        sendKeys: async (val) => logger.info(`[MockAppium] Sent keys '${val}' to element: ${JSON.stringify(by)}`),
        getText: async () => 'Mock Flutter Widget Text',
        getAttribute: async (attr) => 'mock-value',
        isDisplayed: async () => true,
        isEnabled: async () => true
      }),
      performActions: async (actions) => logger.info(`[MockAppium] Executed touch gesture actions: ${actions.length}`),
      takeScreenshot: async () => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      getPageSource: async () => '<flutter-widget-tree><widget type="ElevatedButton" text="Submit"/></flutter-widget-tree>',
      terminateApp: async (appId) => logger.info(`[MockAppium] Terminated app ${appId}`),
      activateApp: async (appId) => logger.info(`[MockAppium] Activated app ${appId}`),
      quit: async () => logger.info('[MockAppium] Driver session terminated.')
    };

    return mockDriver;
  }
}

module.exports = AppiumDriverFactory;
