import { useState, useRef } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Loader2, ImagePlus, X } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import toast from 'react-hot-toast';

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
  disabled?: boolean;
  supportsVision?: boolean;
}

export const ChatInput = ({ onSend, disabled, supportsVision = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { theme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((message.trim() || images.length > 0) && !disabled) {
      onSend(message.trim() || 'Describe esta imagen', images);
      setMessage('');
      setImages([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!supportsVision) {
      toast.error('El modelo actual no soporta imágenes. Selecciona Gemini, GPT-OSS, DeepSeek Chat o DeepSeek R1.');
      return;
    }

    if (images.length + files.length > 4) {
      toast.error('Máximo 4 imágenes por mensaje');
      return;
    }

    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande (máx 5MB)`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      } catch (error) {
        toast.error(`Error al cargar ${file.name}`);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    toast.success(`${newImages.length} imagen(es) agregada(s)`);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`p-4 border-t ${
      theme === 'dark' 
        ? 'border-gray-700/50 bg-gray-900/50' 
        : 'border-gray-200 bg-white/80'
    } backdrop-blur-xl`}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-3">
        {/* Previsualizacion de img */}
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img 
                  src={img} 
                  alt={`Upload ${index + 1}`} 
                  className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              images.length > 0 
                ? "Describe qué quieres saber de la(s) imagen(es)..." 
                : "Escribe tu mensaje aquí... (Shift+Enter para nueva línea)"
            }
            disabled={disabled}
            rows={1}
            className={`flex-1 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-blue-500'
                : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-blue-400'
            }`}
            style={{ minHeight: '50px', maxHeight: '200px' }}
          />

          {/* Subir Imagen Boton */}
          {supportsVision && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={`p-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
              title="Subir imagen"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          )}

          {/* Boton Enviar */}
          <button
            type="submit"
            disabled={(!message.trim() && images.length === 0) || disabled}
            className={`text-white p-3 rounded-2xl transition-all flex items-center justify-center ${
              (!message.trim() && images.length === 0) || disabled
                ? theme === 'dark'
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105'
            }`}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className={`text-xs text-center ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
        }`}>
          {supportsVision 
            ? '🖼️ Este modelo soporta imágenes. Adjunta hasta 4 imágenes (máx 5MB cada una).'
            : 'PatGPT puede cometer errores. Verifica información importante.'}
        </p>
      </form>

      {/* Archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};