const fs = require('fs');
const file = 'backend/sockets/socketHandlers.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the second occurrence too (disconnect handler)
content = content.replace(
  "if (userSockets.size === 0) {",
  "if (userSockets.size === 0 && currentUserId !== 'guest_qr_login' && currentUserId.length === 24) {"
);

fs.writeFileSync(file, content);
