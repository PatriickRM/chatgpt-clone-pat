import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">PatrickGPT</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-400">Listo para empezar</p>
          </div>
        </main>
        
        <footer className="p-4 border-t border-gray-700">
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Envia un mensaje..."
              className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App