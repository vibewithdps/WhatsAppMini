const fs = require('fs');
const file = 'backend/sockets/socketHandlers.js';
let content = fs.readFileSync(file, 'utf8');

// Skip mongoose update for non-valid ObjectIds
content = content.replace(
  "if (currentUserId) {",
  "if (currentUserId && currentUserId !== 'guest_qr_login' && currentUserId.length === 24) {"
);

fs.writeFileSync(file, content);
