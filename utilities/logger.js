const fs = require('fs');
const path = require('path');
const config = require('../config/framework.config');

if (!fs.existsSync(config.paths.logs)) {
  fs.mkdirSync(config.paths.logs, { recursive: true });
}

const appLogPath = path.join(config.paths.logs, 'app.log');
const failureLogPath = path.join(config.paths.logs, 'failures.log');

function formatMsg(level, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
}

function writeToFile(filePath, logLine) {
  try {
    fs.appendFileSync(filePath, logLine + '\n', 'utf-8');
  } catch (err) {
    // Ignore file write error
  }
}

const logger = {
  info: (msg) => {
    const line = formatMsg('INFO', msg);
    console.log(line);
    writeToFile(appLogPath, line);
  },
  warn: (msg) => {
    const line = formatMsg('WARN', msg);
    console.warn(line);
    writeToFile(appLogPath, line);
  },
  error: (msg) => {
    const line = formatMsg('ERROR', msg);
    console.error(line);
    writeToFile(appLogPath, line);
    writeToFile(failureLogPath, line);
  }
};

module.exports = logger;
