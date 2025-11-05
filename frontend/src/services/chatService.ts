import { api } from "./api";
import type { Chat, Message } from "../types";

export const chatService = {
  async getChats(): Promise<Chat[]> {
    const { data } = await api.get<{ chats: Chat[] }>('/chats');
    return data.chats;
  },

  async createChat(title?: string): Promise<Chat> {
    const { data } = await api.post<{ chat: Chat }>('/chats', { title });
    return data.chat;
  },

  async getChat(chatId: string): Promise<Chat> {
    const { data } = await api.get<{ chat: Chat }>(`/chats/${chatId}`);
    return data.chat;
  },

  async deleteChat(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}`);
  },

  async updateChatTitle(chatId: string, title: string): Promise<Chat> {
    const { data } = await api.patch<{ chat: Chat }>(`/chats/${chatId}`, { title });
    return data.chat;
  },

  async sendMessage(chatId: string,content: string,model: string,onToken: (token: string) => void): Promise<Message> {
    const response = await fetch(`${api.defaults.baseURL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content, model })
    });

    if (!response.ok) {
      throw new Error('No se pudo enviar el mensaje');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No hay cuerpo en la respuesta');
    }

    let assistantMessage: Message | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.token) {
              onToken(data.token);
            }
            
            if (data.done && data.message) {
              assistantMessage = data.message;
            }
            
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error:', e);
          }
        }
      }
    }

    if (!assistantMessage) {
      throw new Error('No se recibio mensaje del asistente');
    }

    return assistantMessage;
  }
};
