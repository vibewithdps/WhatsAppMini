import React from 'react';
import { X, CornerUpLeft, Image as ImageIcon, Mic, FileText } from 'lucide-react';

export const QuotedReplyBanner = ({ quotedMessage, onDismiss }) => {
  if (!quotedMessage) return null;

  return (
    <div className="px-4 py-2 bg-wa-dark-header dark:bg-wa-dark-header bg-wa-light-header border-t border-wa-dark-border dark:border-wa-dark-border border-wa-light-border flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-1 self-stretch bg-wa-green rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CornerUpLeft className="w-3.5 h-3.5 text-wa-green" />
            <span className="text-xs font-semibold text-wa-green truncate">
              {quotedMessage.sender?.name || 'User'}
            </span>
          </div>
          <p className="text-xs text-wa-text-secondary truncate mt-0.5">
            {quotedMessage.fileType === 'image' && '📷 Photo'}
            {quotedMessage.fileType === 'voice' && '🎤 Voice Message'}
            {quotedMessage.fileType === 'document' && '📄 Document'}
            {quotedMessage.content || quotedMessage.fileName}
          </p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-full text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-hover transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
