import React from 'react';
import { MoreVertical, Users, Megaphone, ChevronRight } from 'lucide-react';

export const CommunitiesTab = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-wa-dark-bg pb-16 lg:pb-0 relative overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-wa-dark-bg">
        <h1 className="text-xl sm:text-2xl font-normal text-[#111b21] dark:text-white">Communities</h1>
        <div className="flex items-center gap-4 text-[#54656f] dark:text-gray-300">
          <MoreVertical className="w-6 h-6" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* New Community */}
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <div className="relative w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00a884] rounded-full border-2 border-white dark:border-wa-dark-bg flex items-center justify-center text-white font-bold text-lg leading-none">+</div>
          </div>
          <span className="text-[17px] font-medium text-[#111b21] dark:text-white">New community</span>
        </div>

        <div className="h-2 bg-[#f0f2f5] dark:bg-black/20" />

        {/* Community 1 */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center overflow-hidden">
             {/* Mock ADSC logo */}
             <div className="text-red-500 font-bold text-xs">ADSC.Py</div>
          </div>
          <span className="text-[17px] font-medium text-[#111b21] dark:text-white">ADSC.Py</span>
        </div>
        
        {/* Community 1 Channels */}
        <div className="pl-14 pr-4">
          <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <div className="w-10 h-10 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#00a884]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[17px] font-normal text-[#111b21] dark:text-white">Announcements</span>
                <span className="text-xs text-[#54656f]">8/22/26</span>
              </div>
              <p className="text-sm text-[#54656f] dark:text-gray-400 truncate w-60">~ Raksha: 🖼️ ADSC.Py Orientation Sessi...</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-white">
              <span className="text-[10px] font-bold text-blue-500">ADSC</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[17px] font-normal text-[#111b21] dark:text-white">General Chat</span>
                <span className="text-xs text-[#54656f]">22:05</span>
              </div>
              <p className="text-sm text-[#54656f] dark:text-gray-400 truncate w-60">+91 97149 03044 joined from the community</p>
            </div>
          </div>

          <div className="flex items-center gap-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer pl-2">
            <ChevronRight className="w-5 h-5 text-[#54656f]" />
            <span className="text-[15px] font-medium text-[#54656f] dark:text-gray-300">View all</span>
          </div>
        </div>

        <div className="h-2 bg-[#f0f2f5] dark:bg-black/20" />

        {/* Community 2 */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
             <div className="text-[10px] font-bold text-blue-700">VIKASIT</div>
          </div>
          <span className="text-[17px] font-medium text-[#111b21] dark:text-white">Project Vikasit Bharat 2026</span>
        </div>
        
        {/* Community 2 Channels */}
        <div className="pl-14 pr-4">
          <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <div className="w-10 h-10 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#00a884]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[17px] font-normal text-[#111b21] dark:text-white">Announcements</span>
                <span className="text-xs text-[#54656f]">7/30/26</span>
              </div>
              <p className="text-sm text-[#54656f] dark:text-gray-400 truncate w-60">Aryan.Exploree changed this community's set...</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <MoreVertical className="w-5 h-5 text-gray-500 rotate-90" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[17px] font-normal text-[#111b21] dark:text-white">General</span>
                <span className="text-xs text-[#54656f]">8/22/26</span>
              </div>
              <p className="text-sm text-[#54656f] dark:text-gray-400 truncate w-60">~ Shivam Mishhra (Kartik): Ishme join ho jao...</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
