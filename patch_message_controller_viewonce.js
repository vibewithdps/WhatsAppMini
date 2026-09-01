const fs = require('fs');
let code = fs.readFileSync('backend/controllers/messageController.js', 'utf8');

const destructSearch = \`  const { content, chatId, replyToId, encrypted, fileType: customFileType, fileUrl: customFileUrl } = req.body;\`;
const destructReplace = \`  const { content, chatId, replyToId, encrypted, fileType: customFileType, fileUrl: customFileUrl, isViewOnce } = req.body;\`;
code = code.replace(destructSearch, destructReplace);

fs.writeFileSync('backend/controllers/messageController.js', code);
