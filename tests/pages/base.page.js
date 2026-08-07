const { By, until } = require('selenium-webdriver');
const config = require('../config/framework.config');
const logger = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.explicitWaitTimeout = config.explicitWait;
  }

  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  async waitForElementVisible(locator, timeout = this.explicitWaitTimeout) {
    logger.info(`Waiting for element to be visible: ${locator}`);
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async click(locator, timeout = this.explicitWaitTimeout) {
    const elem = await this.waitForElementVisible(locator, timeout);
    await this.driver.wait(until.elementIsVisible(elem), timeout);
    logger.info(`Clicking element: ${locator}`);
    await elem.click();
  }

  async type(locator, text, timeout = this.explicitWaitTimeout) {
    const elem = await this.waitForElementVisible(locator, timeout);
    await elem.clear();
    logger.info(`Typing text into element: ${locator}`);
    await elem.sendKeys(text);
  }

  async getText(locator, timeout = this.explicitWaitTimeout) {
    const elem = await this.waitForElementVisible(locator, timeout);
    const text = await elem.getText();
    logger.info(`Retrieved text '${text}' from ${locator}`);
    return text;
  }

  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  async scrollToElement(locator) {
    const elem = await this.waitForElementVisible(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', elem);
  }

  async acceptAlert() {
    await this.driver.wait(until.alertIsPresent(), this.explicitWaitTimeout);
    const alert = await this.driver.switchTo().alert();
    await alert.accept();
  }

  async dismissAlert() {
    await this.driver.wait(until.alertIsPresent(), this.explicitWaitTimeout);
    const alert = await this.driver.switchTo().alert();
    await alert.dismiss();
  }

  async retryAction(actionFn, retries = config.retryCount) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await actionFn();
      } catch (err) {
        lastError = err;
        logger.warn(`Action failed on attempt ${attempt}/${retries}. Retrying... Error: ${err.message}`);
      }
    }
    throw lastError;
  }
}

module.exports = BasePage;
