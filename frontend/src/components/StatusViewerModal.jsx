import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useStatusStore } from '../store/useStatusStore';
import { useAuthStore } from '../store/useAuthStore';

export const StatusViewerModal = () => {
  const user = useAuthStore((state) => state.user);
  const {
    isViewerModalOpen,
    activeViewingGroup,
    activeStoryIndex,
    closeStoryViewer,
    nextStory,
    prevStory,
    deleteStatus,
  } = useStatusStore();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const story = activeViewingGroup?.stories[activeStoryIndex];
  const isMyStory = activeViewingGroup?.user?._id === user?._id;

  // Auto progression timer (5s per story)
  useEffect(() => {
    if (!isViewerModalOpen || !story || isPaused) return;

    setProgress(0);
    const interval = 50; // ms
    const step = (interval / 5000) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          nextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isViewerModalOpen, story, isPaused, activeStoryIndex, nextStory]);

  if (!isViewerModalOpen || !story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 md:p-6 select-none animate-fade-in">
      <div
        className="w-full max-w-md h-full md:h-[90vh] md:rounded-3xl overflow-hidden relative flex flex-col justify-between shadow-2xl"
        style={{
          backgroundColor: story.mediaType === 'text' ? story.bgColor : '#000000',
        }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 p-4 z-20 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-1.5 mb-3">
            {activeViewingGroup.stories.map((s, idx) => (
              <div
                key={s._id || idx}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < activeStoryIndex
                        ? '100%'
                        : idx === activeStoryIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  activeViewingGroup.user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={activeViewingGroup.user?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
              />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {isMyStory ? 'My Status' : activeViewingGroup.user?.name}
                </h3>
                <p className="text-xs text-white/70">
                  {formatDistanceToNow(new Date(story.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMyStory && (
                <button
                  onClick={() => deleteStatus(story._id)}
                  title="Delete Story"
                  className="p-2 text-white/80 hover:text-red-400 rounded-full hover:bg-white/10"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={closeStoryViewer}
                className="p-2 text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 text-center relative z-10">
          {story.mediaType === 'text' ? (
            <p
              className="text-2xl md:text-3xl font-bold text-white leading-relaxed px-4 break-words"
              style={{ fontFamily: story.font || 'sans-serif' }}
            >
              {story.text}
            </p>
          ) : story.mediaType === 'video' ? (
            <video
              src={story.mediaUrl}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-contain rounded-2xl"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="max-h-full max-w-full object-contain rounded-2xl"
            />
          )}

          {/* Left / Right Tap Areas */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-start pl-2 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-white/70" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-end pr-2 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white/70" />
          </button>
        </div>

        {/* Bottom Caption & Viewers */}
        <div className="p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
          {story.caption && (
            <p className="text-sm text-white text-center mb-2 px-4 py-1.5 bg-black/40 rounded-xl">
              {story.caption}
            </p>
          )}

          {isMyStory && (
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white py-1 px-3 bg-white/20 rounded-full"
            >
              <Eye className="w-4 h-4" />
              <span>{story.viewers?.length || 0} views</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
