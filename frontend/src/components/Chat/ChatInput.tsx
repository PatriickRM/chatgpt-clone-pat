import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const { theme } = useThemeStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`p-4 border-t ${
      theme === 'dark' 
        ? 'border-gray-700/50 bg-gray-900/50' 
        : 'border-gray-200 bg-white/80'
    } backdrop-blur-xl`}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje aquí... (Shift+Enter para nueva línea)"
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-3 pr-12 ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-blue-500'
                : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
            } rounded-2xl focus:outline-none focus:ring-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
            style={{ minHeight: '50px', maxHeight: '200px' }}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`absolute right-2 bottom-2 ${
              !message.trim() || disabled
                ? theme === 'dark'
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105'
            } text-white p-2.5 rounded-xl transition-all flex items-center justify-center`}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className={`text-xs text-center mt-2 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          PatGPT puede cometer errores. Verifica información importante.
        </p>
      </form>
    </div>
  );
};