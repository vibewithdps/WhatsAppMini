const fs = require('fs');
let apiContent = fs.readFileSync('frontend/src/services/api.js', 'utf8');
apiContent = apiContent.replace(
  "return \\`http://\\${window.location.hostname || 'localhost'}:5000/api\\`;",
  "return '/api';"
);
fs.writeFileSync('frontend/src/services/api.js', apiContent);

let socketContent = fs.readFileSync('frontend/src/services/socket.js', 'utf8');
socketContent = socketContent.replace(
  "return \\`http://\\${window.location.hostname || 'localhost'}:5000\\`;",
  "return ''; // empty string means same origin (let Vite proxy it)"
);
fs.writeFileSync('frontend/src/services/socket.js', socketContent);
