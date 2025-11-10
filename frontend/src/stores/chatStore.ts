import { create } from 'zustand';
import type { Chat, Message } from '../types';
import { chatService } from '../services/chatService';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  streamingContent: string;
  selectedModel: string;
  error: string | null;

  loadChats: () => Promise<void>;
  createNewChat: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  setSelectedModel: (model: string) => void;
  clearError: () => void;
}

const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  isSending: false,
  streamingContent: '',
  selectedModel: DEFAULT_MODEL,
  error: null,

  loadChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const chats = await chatService.getChats();
      set({ chats, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Error al cargar los chats',
        isLoading: false 
      });
    }
  },

  createNewChat: async () => {
    set({ isLoading: true, error: null });
    try {
      const chat = await chatService.createChat();
      set(state => ({ 
        chats: [chat, ...state.chats],
        currentChat: chat,
        messages: [],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Error al crear el chat',
        isLoading: false 
      });
    }
  },

  selectChat: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const chat = await chatService.getChat(chatId);
      set({ 
        currentChat: chat,
        messages: chat.messages || [],
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Error al cargar el chat',
        isLoading: false 
      });
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      set(state => {
        const newChats = state.chats.filter(c => c.id !== chatId);
        const isCurrentChat = state.currentChat?.id === chatId;
        
        return {
          chats: newChats,
          currentChat: isCurrentChat ? null : state.currentChat,
          messages: isCurrentChat ? [] : state.messages
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al borrar el chat' });
    }
  },

  sendMessage: async (content: string, images?: string[]) => {
    let { currentChat } = get();
    const { selectedModel, messages } = get();
    
    if (!currentChat) {
      await get().createNewChat();
      currentChat = get().currentChat;
      if (!currentChat) {
        set({ error: 'Error al crear chat' });
        return;
      }
    }

    const chatId = currentChat.id;
    const isFirstMessage = messages.length === 0;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId,
      role: 'user',
      content,
      images: images || [],
      createdAt: new Date().toISOString()
    };

    set(state => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      streamingContent: '',
      error: null
    }));

    try {
      const assistantMessage = await chatService.sendMessage(
        chatId,
        content,
        selectedModel,
        (token) => {
          set(state => ({
            streamingContent: state.streamingContent + token
          }));
        },
        images
      );

      set(state => ({
        messages: [...state.messages, assistantMessage],
        streamingContent: '',
        isSending: false
      }));

      //Si es el primer mensaje, recargar chats para actualizar el título
      if (isFirstMessage) {
        await get().loadChats();
        //Actualizar el chat actual con el nuevo título
        const updatedChat = get().chats.find(c => c.id === chatId);
        if (updatedChat) {
          set({ currentChat: updatedChat });
        }
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al enviar mensaje',
        isSending: false,
        streamingContent: ''
      });
    }
  },

  setSelectedModel: (model: string) => {
    set({ selectedModel: model });
  },

  clearError: () => {
    set({ error: null });
  }
}));