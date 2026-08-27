import React, { useEffect } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Plus,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
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
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return `Yesterday, ${format(date, 'p')}`;
    return format(date, 'MMM d, p');
  };

  return (
    <div className="w-full h-full flex flex-col bg-wa-dark-panel dark:bg-wa-dark-panel bg-wa-light-panel border-r border-wa-dark-border dark:border-wa-dark-border border-wa-light-border pb-16 lg:pb-0">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-wa-dark-border dark:border-wa-dark-border border-wa-light-border">
        <h1 className="text-xl sm:text-2xl font-bold text-wa-text-primary">Calls</h1>
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          title="New Call"
          className="p-2 bg-wa-green text-white rounded-full hover:bg-wa-green-dark transition-colors shadow"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-2 divide-y divide-wa-dark-border/40">
        {isLoadingHistory ? (
          <div className="p-8 text-center text-wa-text-secondary text-sm">
            Loading call history...
          </div>
        ) : callHistory.length === 0 ? (
          <div className="p-8 text-center text-wa-text-secondary">
            <Phone className="w-12 h-12 mx-auto mb-3 text-wa-text-secondary/40" />
            <p className="text-sm">No recent calls.</p>
            <p className="text-xs mt-1 text-wa-text-secondary/70">
              Voice and video calls will show up here.
            </p>
          </div>
        ) : (
          callHistory.map((call) => {
            const isCaller = call.caller?._id === user?._id;
            const peer = isCaller ? call.receiver : call.caller;
            const isMissed = call.status === 'missed' || call.status === 'rejected';

            return (
              <div
                key={call._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-wa-dark-hover/50 dark:hover:bg-wa-dark-hover/50 hover:bg-wa-light-hover/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Peer Avatar */}
                  <img
                    src={
                      peer?.avatar ||
                      '/default-avatar.svg'
                    }
                    alt={peer?.name || 'Contact'}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />

                  {/* Call Info */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isMissed && !isCaller
                          ? 'text-red-400'
                          : 'text-wa-text-primary'
                      }`}
                    >
                      {peer?.name || 'WhatsApp Contact'}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-wa-text-secondary mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-400" />
                      ) : isCaller ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-wa-green" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-wa-green" />
                      )}
                      <span>{formatCallDate(call.createdAt)}</span>
                      {call.duration > 0 && (
                        <span>• {call.duration}s</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Redial Button */}
                {peer && (
                  <button
                    onClick={() =>
                      startCall({
                        receiverUser: peer,
                        callType: call.callType || 'audio',
                        chatId: call.chat,
                      })
                    }
                    title={`Call ${peer.name}`}
                    className="p-2 text-wa-green hover:bg-wa-green/10 rounded-full transition-colors flex-shrink-0"
                  >
                    {call.callType === 'video' ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
