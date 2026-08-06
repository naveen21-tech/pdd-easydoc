const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"], input[name="email"]');
    this.passwordInput = By.css('input[type="password"], input[name="password"]');
    this.submitBtn = By.css('button[type="submit"]');
    this.errorMessage = By.css('.error-message, [role="alert"]');
    this.authHeader = By.css('h1, h2');
  }

  async login(email, password) {
    if (email) await this.type(this.emailInput, email);
    if (password) await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }
}

module.exports = LoginPage;
