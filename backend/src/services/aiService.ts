import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamOptions {
  model?: string;
  messages: AIMessage[];
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
}

export const AVAILABLE_MODELS = [
  { 
    id: 'meta-llama/llama-3.2-3b-instruct:free', 
    name: 'Llama 3.2 3B (Free)',
    provider: 'Meta'
  },
  { 
    id: 'google/gemma-3-27b-it:free', 
    name: 'Gemma 3 27B (Free)',
    provider: 'Google'
  },
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Gemini 2.0 Flash Experimental (Free)',
    provider: 'Google'
  },
  { 
    id: 'openai/gpt-oss-20b:free', 
    name: 'GPT-OSS 20B (Free)',
    provider: 'OpenAI'
  },
  { 
    id: 'deepseek/deepseek-chat-v3.1:free', 
    name: 'DeepSeek Chat V3.1 (Free)',
    provider: 'DeepSeek'
  },
  { 
    id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', 
    name: 'DeepSeek R1 Qwen3 8B (Free)',
    provider: 'DeepSeek'
  }
];

export const DEFAULT_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';


export async function generateAIResponse(options: StreamOptions) {
  const { model = DEFAULT_MODEL, messages } = options;

  const result = await streamText({
    model: openai(model),
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  });

  return result;
}
