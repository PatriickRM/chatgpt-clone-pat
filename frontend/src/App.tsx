import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';

function App() {
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, checkAuth, logout, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  //Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  //Si no esta autenticado, mostrar login o register
  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  //Mostrar app si esta autenticado
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
            <span>+</span>
            <span>Nuevo Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-gray-500 text-sm px-3 py-2">No hay Chats aún</p>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">PatGPT</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-2">
                Bienvenido, {user.name || 'there'}! 👋
              </h2>
              <p className="text-gray-400">
                Inicia una conversación escribiendo un mensaje abajo.
              </p>
            </div>
          </div>
        </main>

        <footer className="p-4 border-t border-gray-800">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    console.log('Send message:', message);
                    setMessage('');
                  }
                }}
                placeholder="Send a message..."
                className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button
                onClick={() => {
                  if (message.trim()) {
                    console.log('Send message:', message);
                    setMessage('');
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!message.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              PatGPT 2025.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;