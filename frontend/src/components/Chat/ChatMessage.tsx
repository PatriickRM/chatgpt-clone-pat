import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import type { Message } from '../../types';
import { useThemeStore } from '../../stores/themeStore';
import toast from 'react-hot-toast';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
}

export const ChatMessage = ({ message, isStreaming, streamingContent }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useThemeStore();
  const isUser = message.role === 'user';
  const content = isStreaming ? streamingContent : message.content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || '');
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  return (
    <div className={`group relative ${
      isUser 
        ? theme === 'dark' ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20' : 'bg-gradient-to-r from-blue-50 to-purple-50'
        : theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
    } border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'}`}>
      <div className="max-w-4xl mx-auto px-6 py-6 flex gap-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30'
            : theme === 'dark'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-400/30'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold mb-2 text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {isUser ? 'Tú' : 'Asistente'}
          </div>
          
          <div className={`prose prose-sm max-w-none ${
            theme === 'dark' 
              ? 'prose-invert prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700' 
              : 'prose-gray prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200'
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  return !inline && match ? (
                    <div className="relative group/code">
                      <div className={`absolute right-2 top-2 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      } text-xs font-mono bg-gray-800 px-2 py-1 rounded`}>
                        {language}
                      </div>

                      <SyntaxHighlighter
                        style={theme === 'dark' ? (oneDark as any) : (oneLight as any)}
                        language={language}
                        PreTag="div"
                        className="rounded-lg !mt-2"
                        showLineNumbers
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={`${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-pink-400' 
                          : 'bg-gray-100 text-pink-600'
                      } px-1.5 py-0.5 rounded text-sm font-mono`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/*Boton de copiar*/}
        {!isUser && !isStreaming && (
          <button
            onClick={handleCopy}
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title="Copiar mensaje"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};