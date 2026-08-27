const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ChatList.jsx', 'utf8');

if (!content.includes('MoreVertical')) {
  content = content.replace('Users,', 'Users,\n  MoreVertical,');
}

const headerOld = `<div className="p-3 sm:p-4 flex items-center justify-between border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border">
        <h1 className="text-xl sm:text-2xl font-bold text-wa-text-primary">
          Chats
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            title="New Group"
            className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover dark:hover:bg-wa-dark-hover hover:bg-wa-light-hover rounded-full transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            title="New Chat"
            className="p-2 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>`;

const headerNew = `<div className="p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-wa-dark-panel">
        <h1 className="text-xl font-bold text-[#25d366] tracking-tight">
          WhatsApp
        </h1>
        <div className="flex items-center gap-3">
          <button
            title="Menu"
            className="text-[#54656f] dark:text-gray-300 hover:text-gray-700 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            title="New Chat"
            className="p-1.5 bg-[#00a884] text-white rounded-md hover:bg-[#06cf9c] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>`;

content = content.replace(headerOld, headerNew);

const searchOld = `{/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-wa-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-wa-dark-input text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-wa-text-secondary focus:outline-none focus:ring-1 focus:ring-wa-green"
          />
        </div>
      </div>`;

const searchNew = `{/* Search Bar */}
      <div className="px-4 pt-2 pb-3 bg-white dark:bg-wa-dark-panel border-b border-gray-100 dark:border-wa-dark-border">
        <div className="relative flex items-center mb-3">
          <Search className="w-4 h-4 absolute left-3 text-[#54656f] dark:text-wa-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start a new chat"
            className="w-full pl-10 pr-4 py-1.5 text-[15px] rounded-lg bg-[#f0f2f5] dark:bg-wa-dark-input text-[#111b21] dark:text-white placeholder-[#8696a0] dark:placeholder-wa-text-secondary focus:outline-none"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setChatFilter('all')}
            className={\`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors \${chatFilter === 'all' ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#d1d7db]' : 'bg-[#f0f2f5] dark:bg-wa-dark-input text-[#54656f] dark:text-[#8696a0]'}\`}
          >
            All
          </button>
          <button 
            onClick={() => setChatFilter('unread')}
            className={\`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors \${chatFilter === 'unread' ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#d1d7db]' : 'bg-[#f0f2f5] dark:bg-wa-dark-input text-[#54656f] dark:text-[#8696a0]'}\`}
          >
            Unread 
          </button>
          <button 
            className="px-3 py-1 text-sm rounded-full whitespace-nowrap bg-[#f0f2f5] dark:bg-wa-dark-input text-[#54656f] dark:text-[#8696a0]"
          >
            Favorites
          </button>
          <button 
            onClick={() => setChatFilter('groups')}
            className={\`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors \${chatFilter === 'groups' ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#d1d7db]' : 'bg-[#f0f2f5] dark:bg-wa-dark-input text-[#54656f] dark:text-[#8696a0]'}\`}
          >
            Groups
          </button>
        </div>
      </div>`;

content = content.replace(searchOld, searchNew);

fs.writeFileSync('frontend/src/components/ChatList.jsx', content);
