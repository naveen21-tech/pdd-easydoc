const logger = require('./logger');

class SecurityScanner {
  static scanXSSPayload(payload) {
    const dangerousPatterns = [/<script>/i, /javascript:/i, /onerror=/i, /onload=/i, /eval\(/i];
    return !dangerousPatterns.some(pattern => pattern.test(payload));
  }

  static scanSQLInjectionPayload(payload) {
    const dangerousPatterns = [/' OR '1'='1/i, /UNION SELECT/i, /DROP TABLE/i, /;--/i];
    return !dangerousPatterns.some(pattern => pattern.test(payload));
  }

  static validateSecurityHeaders(headers) {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'content-security-policy',
      'referrer-policy'
    ];
    const missing = [];
    for (const h of requiredHeaders) {
      if (!headers[h] && !headers[h.toLowerCase()]) {
        missing.push(h);
      }
    }
    return {
      compliant: missing.length === 0,
      missing
    };
  }
}

module.exports = SecurityScanner;
