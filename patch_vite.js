const fs = require('fs');
let content = fs.readFileSync('frontend/vite.config.js', 'utf8');
content = content.replace(
  "host: true,",
  "host: true,\n    allowedHosts: true,"
);
fs.writeFileSync('frontend/vite.config.js', content);
