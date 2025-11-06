import { useEffect, useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun, MessageSquarePlus, Trash2, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import { useThemeStore } from './stores/themeStore';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ChatMessage } from './components/Chat/ChatMessage';
import { ChatInput } from './components/Chat/ChatInput';

const MODELS = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B' },
  { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat' },
  { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1' }
];

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, checkAuth, logout, isLoading: authLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    chats = [],
    currentChat,
    messages = [],
    streamingContent,
    isSending,
    selectedModel,
    loadChats,
    createNewChat,
    selectChat,
    deleteChat,
    sendMessage,
    setSelectedModel
  } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) loadChats();
  }, [user, loadChats]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        {authMode === 'login' ? (
          <Login onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </>
    );
  }

  return (
    <div className={`flex h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900/50' : 'bg-white/80'
      } backdrop-blur-xl border-r ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      } flex flex-col overflow-hidden`}>
        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-700/50">
          <button
            onClick={createNewChat}
            className={`w-full ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
            } text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105`}
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span className="font-semibold">Nuevo Chat</span>
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!chats || chats.length === 0 ? (
            <p className={`text-sm px-3 py-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Sin chats aún
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-xl transition-all ${
                  currentChat?.id === chat.id
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                      : 'bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300'
                    : theme === 'dark'
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => selectChat(chat.id)}
                  className="w-full text-left px-4 py-3 rounded-xl"
                >
                  <p className={`text-sm font-medium truncate ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {chat.title}
                  </p>
                </button>
                <button
                  onClick={() => deleteChat(chat.id)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'hover:bg-red-500/20 text-red-400'
                      : 'hover:bg-red-100 text-red-500'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Section */}
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
        } space-y-3`}>
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className={`w-full ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } text-sm px-3 py-2 rounded-lg flex items-center justify-between transition-all`}
            >
              <span className={`truncate ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {MODELS.find(m => m.id === selectedModel)?.name || 'Modelo'}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showModelSelector && (
              <div className={`absolute bottom-full left-0 right-0 mb-2 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-2xl border ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              } overflow-hidden max-h-60 overflow-y-auto`}>
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedModel === model.id
                        ? theme === 'dark'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                        : theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
          }`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {user.name || user.email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>
            <button
              onClick={logout}
              className={`flex-1 ${
                theme === 'dark'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  : 'bg-red-100 hover:bg-red-200 text-red-600'
              } py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700/50 bg-gray-900/50' : 'border-gray-200 bg-white/80'
        } backdrop-blur-xl flex items-center gap-4`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className={`text-xl font-bold bg-gradient-to-r ${
            theme === 'dark'
              ? 'from-blue-400 to-purple-400'
              : 'from-blue-600 to-purple-600'
          } bg-clip-text text-transparent`}>
            {currentChat ? currentChat.title : 'PatGPT'}
          </h1>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          {!currentChat ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                  <MessageSquarePlus className="w-10 h-10 text-white" />
                </div>
                <h2 className={`text-3xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  ¡Hola, {user.name || 'amigo'}! 👋
                </h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Crea un nuevo chat para comenzar una conversación con la IA
                </p>
              </div>
            </div>
          ) : (!messages || messages.length === 0) && !isSending ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Envía tu primer mensaje para iniciar
                </p>
              </div>
            </div>
          ) : (
            <div>
              {messages && messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && streamingContent && (
                <ChatMessage
                  message={{
                    id: 'streaming',
                    chatId: currentChat.id,
                    role: 'assistant',
                    content: streamingContent,
                    createdAt: new Date().toISOString()
                  }}
                  isStreaming={true}
                  streamingContent={streamingContent}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </div>
    </div>
  );
}

export default App;
