const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class RouteDiscovery {
  static discoverRoutesAndForms(appDir = path.join(__dirname, '..', 'app')) {
    logger.info(`[RouteDiscovery] Scanning React app routes in ${appDir}`);
    const routes = [];

    const scanDirectory = (dir, currentRoute = '') => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          let segment = entry.name;
          if (segment.startsWith('(') && segment.endsWith(')')) {
            // Group folder (e.g. (auth), (user), (admin))
            scanDirectory(path.join(dir, entry.name), currentRoute);
          } else {
            const nextRoute = `${currentRoute}/${segment}`;
            scanDirectory(path.join(dir, entry.name), nextRoute);
          }
        } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx' || entry.name === 'page.js') {
          const routePath = currentRoute || '/';
          const fileContent = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
          
          const hasForm = fileContent.includes('<form') || fileContent.includes('input') || fileContent.includes('Button');
          const inputs = [];
          if (fileContent.includes('email')) inputs.push('email');
          if (fileContent.includes('password')) inputs.push('password');
          if (fileContent.includes('name') || fileContent.includes('title')) inputs.push('text');
          if (fileContent.includes('phone')) inputs.push('phone');

          routes.push({
            path: routePath,
            filePath: path.join(dir, entry.name),
            hasForm,
            inputs: inputs.length > 0 ? inputs : ['text']
          });
        }
      }
    };

    scanDirectory(appDir);
    logger.info(`[RouteDiscovery] Discovered ${routes.length} React routes with dynamic form controls.`);
    return routes;
  }
}

module.exports = RouteDiscovery;
