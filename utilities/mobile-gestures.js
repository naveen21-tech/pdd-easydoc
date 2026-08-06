const logger = require('./logger');

class MobileGestures {
  static async tap(driver, x, y) {
    logger.info(`[MobileGestures] Tap at coordinates (${x}, ${y})`);
    if (driver.performActions) {
      await driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x, y },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerUp', button: 0 }
          ]
        }
      ]);
    }
  }

  static async doubleTap(driver, x, y) {
    logger.info(`[MobileGestures] Double tap at coordinates (${x}, ${y})`);
    await this.tap(driver, x, y);
    await this.tap(driver, x, y);
  }

  static async longPress(driver, x, y, durationMs = 1500) {
    logger.info(`[MobileGestures] Long press at coordinates (${x}, ${y}) for ${durationMs}ms`);
    if (driver.performActions) {
      await driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x, y },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: durationMs },
            { type: 'pointerUp', button: 0 }
          ]
        }
      ]);
    }
  }

  static async swipe(driver, startX, startY, endX, endY, durationMs = 500) {
    logger.info(`[MobileGestures] Swipe from (${startX}, ${startY}) to (${endX}, ${endY})`);
    if (driver.performActions) {
      await driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerMove', duration: durationMs, x: endX, y: endY },
            { type: 'pointerUp', button: 0 }
          ]
        }
      ]);
    }
  }

  static async scrollUntilVisible(driver, targetLocator, maxSwipes = 5) {
    logger.info(`[MobileGestures] Scrolling until visible max ${maxSwipes} attempts`);
    for (let i = 0; i < maxSwipes; i++) {
      try {
        const elem = await driver.findElement(targetLocator);
        if (elem && (await elem.isDisplayed())) {
          return elem;
        }
      } catch (e) {
        // Continue scrolling
      }
      await this.swipe(driver, 500, 1200, 500, 400);
    }
    throw new Error(`Element not found after ${maxSwipes} scroll attempts.`);
  }

  static async dragAndDrop(driver, startX, startY, endX, endY) {
    logger.info(`[MobileGestures] Drag and drop from (${startX}, ${startY}) to (${endX}, ${endY})`);
    await this.swipe(driver, startX, startY, endX, endY, 1000);
  }

  static async pinch(driver, centerX, centerY) {
    logger.info(`[MobileGestures] Pinch gesture centered at (${centerX}, ${centerY})`);
  }

  static async zoom(driver, centerX, centerY) {
    logger.info(`[MobileGestures] Zoom gesture centered at (${centerX}, ${centerY})`);
  }
}

module.exports = MobileGestures;
