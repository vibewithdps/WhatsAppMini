import React, { useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Link2,
  Calendar,
  Grid,
  Plus
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChatStore } from '../store/useChatStore';

export const CallsTab = () => {
  const user = useAuthStore((state) => state.user);
  const { callHistory, fetchCallHistory, isLoadingHistory } = useCallStore();
  const { setIsNewChatModalOpen } = useChatStore();
  const { startCall } = useWebRTC();

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const formatCallDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`;
    return format(date, 'MMMM d, HH:mm');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-wa-dark-bg pb-16 lg:pb-0 relative">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-white dark:bg-wa-dark-bg">
        <h1 className="text-xl sm:text-2xl font-normal text-[#111b21] dark:text-white">Calls</h1>
        
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <h2 className="px-4 mt-2 mb-2 text-[15px] font-medium text-[#54656f] dark:text-white">Recent</h2>

        {/* Calls List */}
        <div className="flex flex-col">
          {(!Array.isArray(callHistory) || callHistory.length === 0) ? (
            <div className="p-8 text-center text-[#54656f]">
              <p>No recent calls.</p>
            </div>
          ) : (
            (Array.isArray(callHistory) ? callHistory : []).map((call) => {
              const otherUser =
                call.caller?._id === user?._id ? call.receiver : call.caller;
              const isOutgoing = call.caller?._id === user?._id;
              const isMissed = call.status === 'missed';

              return (
                <div
                  key={call._id}
                  className="flex items-center px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-gray-800 cursor-pointer"
                >
                  {/* Avatar */}
                  <img
                    src={otherUser?.avatar || '/default-avatar.svg'}
                    alt={otherUser?.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className={`text-[17px] font-normal ${isMissed ? 'text-red-500' : 'text-[#111b21] dark:text-white'}`}>
                      {otherUser?.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center text-sm text-[#54656f] dark:text-gray-400 gap-1 mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-4 h-4 text-red-500" />
                      ) : isOutgoing ? (
                        <PhoneOutgoing className="w-4 h-4 text-[#25d366]" />
                      ) : (
                        <PhoneIncoming className="w-4 h-4 text-[#25d366]" />
                      )}
                      <span>{formatCallDate(call.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCall(otherUser, call.type === 'video');
                    }}
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {call.type === 'video' ? (
                      <Video className="w-6 h-6 text-[#00a884]" />
                    ) : (
                      <Phone className="w-6 h-6 text-[#00a884]" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>
  );
};
