import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
}

export const ChatMessage = ({ message, isStreaming, streamingContent }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const content = isStreaming ? streamingContent : message.content;

  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'bg-gray-800' : 'bg-gray-900'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-green-600'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-sm text-gray-300">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="text-gray-100 whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="animate-pulse">▊</span>}
        </div>
      </div>
    </div>
  );
};
