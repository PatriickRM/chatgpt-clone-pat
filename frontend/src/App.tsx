import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ChatMessage } from './components/Chat/ChatMessage';
import { ChatInput } from './components/Chat/ChatInput';

const MODELS = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Experimental (Free)' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat V3.1 (Free)' },
  { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B (Free)' }
];

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authstore
  const { user, checkAuth, logout, isLoading: authLoading } = useAuthStore();

  //Chatstore
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


  // Autoscroll hacia el final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  //Comprobar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  //Cargar chats al autenticar
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  //Estados de carga
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  //No autenticado - mostrar login o registro
  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  //Autenticado - mostrar interfaz de chat
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <span className="text-xl">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-2">
           {!chats || chats.length === 0 ? (
            <p className="text-gray-500 text-sm px-3 py-2">Sin Chats Aùn</p>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div key={chat.id} className="group relative">
                  <button
                    onClick={() => selectChat(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      currentChat?.id === chat.id
                        ? 'bg-gray-800'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <p className="text-sm truncate">{chat.title}</p>
                  </button>
                  <button
                    onClick={() => deleteChat(chat.id)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-between transition"
            >
              <span className="truncate">
                {MODELS.find(m => m.id === selectedModel)?.name || 'Select Model'}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showModelSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition ${
                      selectedModel === model.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info de Usuario */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || user.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition"
          >
            Desconectar
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">
            {currentChat ? currentChat.title : 'ChatGPT Clone'}
          </h1>
        </header>

        {/* Mensaje */}
        <main className="flex-1 overflow-y-auto">
          {!currentChat ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold mb-2">
                  Bienvenido, {user.name || 'there'}! 👋
                </h2>
                <p className="text-gray-400">
                  Empieza creando un nuevo chat para comenzar la conversación.
                </p>
              </div>
            </div>
          ) : (!messages || messages.length === 0) && !isSending ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-8">
                <p className="text-gray-400">
                  Envia tu primer mensaje para iniciar la conversación.
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
        <ChatInput
          onSend={sendMessage}
          disabled={isSending}
        />
      </div>
    </div>
  );
}

export default App;
