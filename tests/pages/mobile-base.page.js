const BasePage = require('./base.page');

class MobileBasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(locator) {
    return await this.driver.findElement(locator);
  }

  async click(locator) {
    const elem = await this.findElement(locator);
    await elem.click();
  }

  async sendKeys(locator, value) {
    const elem = await this.findElement(locator);
    await elem.sendKeys(value);
  }

  async getText(locator) {
    const elem = await this.findElement(locator);
    return await elem.getText();
  }
}

module.exports = MobileBasePage;
