const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ChatWindow.jsx', 'utf8');

// Add imports for empty state
if (!content.includes('UserPlus')) {
  content = content.replace(
    'ArrowLeft,',
    'ArrowLeft,\n  UserPlus,\n  Sparkles,\n  FileText as FileIcon,'
  );
}

const emptyStateOld = `<div className="flex-1 h-full flex flex-col items-center justify-center bg-wa-dark-bg dark:bg-wa-dark-bg bg-wa-light-bg p-8 text-center border-b-4 border-wa-green">
        <div className="w-32 h-32 md:w-40 md:h-40 mb-6 rounded-3xl p-2 bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel flex items-center justify-center shadow-2xl border border-cyan-500/20">
          <img src="/logo.png" alt="WhatsApp Mini" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-wa-text-primary mb-2">
          WhatsApp_Mini
        </h2>
        <p className="text-sm text-wa-text-secondary max-w-md leading-relaxed">
          Send and receive messages in real time with high-quality voice & video calls, end-to-end encryption, and 24-hour status updates.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-wa-text-secondary">
          <Lock className="w-3.5 h-3.5 text-wa-green" />
          <span>End-to-end encrypted</span>
        </div>
      </div>`;

const emptyStateNew = `<div className="flex-1 h-full flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-wa-dark-bg p-8 text-center">
        {/* Main Card */}
        <div className="bg-white dark:bg-wa-dark-panel rounded-3xl shadow-sm border border-gray-100 dark:border-wa-dark-border p-12 max-w-lg w-full flex flex-col items-center mb-8">
          
          {/* Illustration Mock */}
          <div className="relative mb-8 w-48 h-32 flex items-center justify-center">
            {/* Laptop Base */}
            <div className="absolute bottom-0 w-48 h-2 bg-[#d1d7db] dark:bg-gray-700 rounded-b-xl border border-gray-400 dark:border-gray-600"></div>
            {/* Laptop Screen */}
            <div className="absolute bottom-2 w-40 h-28 bg-[#fdfdfd] dark:bg-gray-800 rounded-t-xl border-2 border-[#d1d7db] dark:border-gray-600 flex items-center justify-center">
              {/* WhatsApp UI inside screen */}
              <div className="w-full h-full flex">
                <div className="w-1/3 border-r-2 border-[#e9edef] dark:border-gray-700 p-2 flex flex-col gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#00a884] opacity-80"></div>
                  <div className="w-full h-1 bg-[#e9edef] dark:bg-gray-700 rounded"></div>
                  <div className="w-full h-1 bg-[#e9edef] dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-wa-dark-bg">
                  <div className="bg-[#d9fdd3] dark:bg-[#005c4b] p-3 rounded-xl rounded-tr-none shadow-sm flex items-center justify-center border border-gray-300 dark:border-transparent">
                    <Phone className="w-6 h-6 text-[#111b21] dark:text-white" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-normal text-[#41525d] dark:text-white mb-4">
            Voice and video calling is now available
          </h2>
          <p className="text-[15px] text-[#8696a0] dark:text-gray-400 mb-8 max-w-sm">
            Now you can make and join calls on WhatsApp Web.
          </p>
          <button className="bg-[#25d366] hover:bg-[#06cf9c] text-white font-semibold py-2.5 px-6 rounded-full transition-colors">
            Go to Calls
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-12 mt-4">
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <FileIcon className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Send document</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setIsNewChatModalOpen(true)}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <UserPlus className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Add contact</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => {}}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <Video className="w-5 h-5 text-[#54656f] dark:text-gray-300" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">New call</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-wa-dark-panel shadow-sm border border-gray-200 dark:border-wa-dark-border flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <Sparkles className="w-5 h-5 text-[#00a884]" />
            </div>
            <span className="text-xs text-[#54656f] dark:text-gray-400 font-medium">Ask Meta AI</span>
          </div>
        </div>
      </div>`;

content = content.replace(emptyStateOld, emptyStateNew);
fs.writeFileSync('frontend/src/components/ChatWindow.jsx', content);
