import React, { useEffect } from 'react';
import { Search, MoreVertical, Plus, Edit2, Camera, Compass } from 'lucide-react';
import { useStatusStore } from '../store/useStatusStore';
import { useAuthStore } from '../store/useAuthStore';
import { Eye } from 'lucide-react';

export const StatusTab = () => {
  const user = useAuthStore((state) => state.user);
  const {
    myStatus,
    recentUpdates,
    fetchStatusFeed,
    openStoryViewer,
    setIsCreateStatusModalOpen,
  } = useStatusStore();

  useEffect(() => {
    fetchStatusFeed();
  }, [fetchStatusFeed]);

  const hasMyStories = myStatus?.stories && myStatus.stories.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-wa-dark-bg pb-16 lg:pb-0 relative">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-wa-dark-bg">
        <h1 className="text-xl sm:text-2xl font-normal text-[#111b21] dark:text-white">Updates</h1>
        <div className="flex items-center gap-4 text-[#54656f] dark:text-gray-300">
          <Search className="w-6 h-6" />
          <MoreVertical className="w-6 h-6" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Status Section */}
        <div className="px-4 py-2">
          <h2 className="text-lg font-medium text-[#111b21] dark:text-white mb-3">Status</h2>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {/* My Status Card */}
            <div 
              onClick={() => {
                if (hasMyStories) openStoryViewer(myStatus);
                else setIsCreateStatusModalOpen(true);
              }}
              className="flex-shrink-0 w-24 h-36 rounded-2xl relative overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer"
            >
              <img src={user?.avatar || '/default-avatar.svg'} className="w-full h-full object-cover opacity-70" alt="My Status" />
              <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-2 border-[#25d366] overflow-hidden bg-white">
                <img src={user?.avatar || '/default-avatar.svg'} className="w-full h-full object-cover" />
              </div>
              {!hasMyStories && (
                <div className="absolute top-7 left-7 w-4 h-4 rounded-full bg-[#25d366] text-white flex items-center justify-center border-2 border-white">
                  <Plus className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-md">My status</div>
            </div>

            {/* Other Statuses */}
            {recentUpdates.map(status => (
              <div 
                key={status.user._id}
                onClick={() => openStoryViewer(status)}
                className="flex-shrink-0 w-24 h-36 rounded-2xl relative overflow-hidden bg-gray-800 cursor-pointer"
              >
                {/* Background Preview */}
                {status.stories[0]?.mediaUrl ? (
                  <img src={status.stories[0].mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                )}
                {/* Avatar */}
                <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-2 border-[#25d366] overflow-hidden bg-white">
                  <img src={status.user.avatar || '/default-avatar.svg'} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-md truncate w-20">
                  {status.user.name}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Viewed Updates Section */}
        {statusFeed?.viewedUpdates?.length > 0 && (
          <>
            <div className="h-2 bg-[#f0f2f5] dark:bg-black/20 my-2" />
            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-semibold text-wa-text-secondary">Viewed updates</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {statusFeed.viewedUpdates.map(status => (
                  <div 
                    key={status.user._id}
                    onClick={() => openStoryViewer(status)}
                    className="flex-shrink-0 w-24 h-36 rounded-2xl relative overflow-hidden bg-gray-800 cursor-pointer opacity-80"
                  >
                    {/* Background Preview */}
                    {status.stories[0]?.mediaUrl ? (
                      <img src={status.stories[0].mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    )}
                    {/* Avatar */}
                    <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-2 border-gray-400 overflow-hidden bg-white">
                      <img src={status.user.avatar || '/default-avatar.svg'} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-md truncate w-20">
                      {status.user.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        </div>

      {/* FABs */}
      <div className="lg:hidden absolute bottom-24 right-4 flex flex-col items-center gap-4 z-50">
        <button
          onClick={() => setIsCreateStatusModalOpen(true)}
          className="w-10 h-10 bg-[#f0f2f5] dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <Edit2 className="w-5 h-5 text-[#54656f] dark:text-white" />
        </button>
        <button
          onClick={() => setIsCreateStatusModalOpen(true)}
          className="w-14 h-14 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-xl transition-transform active:scale-95"
        >
          <Camera className="w-6 h-6 text-white" fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
