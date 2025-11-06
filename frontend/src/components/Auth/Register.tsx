import { useState as useStateReg } from 'react';
import type { FormEvent as FormEventReg } from 'react';
import { Mail as MailReg, Lock as LockReg, User as UserReg, UserPlus, Sparkles as SparklesReg } from 'lucide-react';
import { useAuthStore as useAuthStoreReg } from '../../stores/authStore';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const [name, setName] = useStateReg('');
  const [email, setEmail] = useStateReg('');
  const [password, setPassword] = useStateReg('');
  const [confirmPassword, setConfirmPassword] = useStateReg('');
  const { register, isLoading, error, clearError } = useAuthStoreReg();

  const handleSubmit = async (e: FormEventReg) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(email, password, name);
    } catch (error) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      
      <div className="relative w-full max-w-md">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        
        <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg shadow-pink-500/50">
              <SparklesReg className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Crear Cuenta
            </h2>
            <p className="text-purple-200">
              Únete a PatGPT hoy
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Nombre (opcional)
              </label>
              <div className="relative">
                <UserReg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/10"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <MailReg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/10"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <LockReg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/10"
                  placeholder="••••••••"
                  required
                  minLength={7}
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <LockReg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>Cargando...</>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          <p className="text-purple-200 text-center mt-6">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-white font-semibold hover:underline"
            >
              Inicia Sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
