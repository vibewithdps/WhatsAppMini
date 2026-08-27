import React, { useEffect } from 'react';
import { Plus, Camera, Edit2, CircleDot, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useStatusStore } from '../store/useStatusStore';
import { useAuthStore } from '../store/useAuthStore';

export const StatusTab = () => {
  const user = useAuthStore((state) => state.user);
  const {
    myStatus,
    recentUpdates,
    viewedUpdates,
    fetchStatusFeed,
    openStoryViewer,
    setIsCreateStatusModalOpen,
  } = useStatusStore();

  useEffect(() => {
    fetchStatusFeed();
  }, [fetchStatusFeed]);

  const hasMyStories = myStatus?.stories && myStatus.stories.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel border-r border-wa-dark-border dark:border-wa-dark-border border-wa-light-border pb-16 lg:pb-0">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border">
        <h1 className="text-xl sm:text-2xl font-bold text-wa-text-primary">Status</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateStatusModalOpen(true)}
            title="Create Status"
            className="p-2 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-2 divide-y divide-wa-dark-border/30">
        {/* My Status Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                if (hasMyStories) {
                  openStoryViewer(myStatus);
                } else {
                  setIsCreateStatusModalOpen(true);
                }
              }}
              className="flex items-center gap-3 cursor-pointer group flex-1"
            >
              {/* My Status Avatar */}
              <div className="relative">
                <img
                  src={
                    user?.avatar ||
                    '/default-avatar.svg'
                  }
                  alt={user?.name}
                  className={`w-12 h-12 rounded-full object-cover ${
                    hasMyStories
                      ? 'ring-2 ring-wa-green ring-offset-2 ring-offset-wa-dark-panel'
                      : ''
                  }`}
                />
                {!hasMyStories && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-wa-green rounded-full text-white flex items-center justify-center border-2 border-wa-dark-panel">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-wa-text-primary group-hover:text-wa-green transition-colors">
                  My Status
                </h3>
                <p className="text-xs text-wa-text-secondary mt-0.5">
                  {hasMyStories
                    ? `${myStatus.stories.length} active update${
                        myStatus.stories.length > 1 ? 's' : ''
                      }`
                    : 'Tap to add status update'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateStatusModalOpen(true)}
              className="p-2 text-wa-text-secondary hover:text-wa-green rounded-full hover:bg-wa-dark-hover"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Updates */}
        {recentUpdates.length > 0 && (
          <div className="py-3">
            <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-wa-green mb-2">
              Recent updates
            </h4>
            {recentUpdates.map((group) => (
              <div
                key={group.user._id}
                onClick={() => openStoryViewer(group)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50 cursor-pointer transition-colors"
              >
                <img
                  src={
                    group.user.avatar ||
                    '/default-avatar.svg'
                  }
                  alt={group.user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-wa-green ring-offset-2 ring-offset-wa-dark-panel"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-wa-text-primary truncate">
                    {group.user.name}
                  </h3>
                  <p className="text-xs text-wa-text-secondary mt-0.5">
                    {formatDistanceToNow(new Date(group.latestStoryTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Viewed Updates */}
        {viewedUpdates.length > 0 && (
          <div className="py-3">
            <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-wa-text-secondary mb-2">
              Viewed updates
            </h4>
            {viewedUpdates.map((group) => (
              <div
                key={group.user._id}
                onClick={() => openStoryViewer(group)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50 cursor-pointer transition-colors opacity-75"
              >
                <img
                  src={
                    group.user.avatar ||
                    '/default-avatar.svg'
                  }
                  alt={group.user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-wa-text-secondary/50 ring-offset-2 ring-offset-wa-dark-panel"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-wa-text-primary truncate">
                    {group.user.name}
                  </h3>
                  <p className="text-xs text-wa-text-secondary mt-0.5">
                    {formatDistanceToNow(new Date(group.latestStoryTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentUpdates.length === 0 && viewedUpdates.length === 0 && (
          <div className="p-8 text-center text-wa-text-secondary">
            <CircleDot className="w-12 h-12 mx-auto mb-3 text-wa-text-secondary/40" />
            <p className="text-sm">No status updates yet.</p>
            <p className="text-xs mt-1 text-wa-text-secondary/70">
              Updates from contacts disappear after 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
