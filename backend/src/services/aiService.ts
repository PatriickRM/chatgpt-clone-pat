export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamOptions {
  model?: string;
  messages: AIMessage[];
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

export async function* generateAIResponse(options: StreamOptions): AsyncGenerator<string> {
  const { model = DEFAULT_MODEL, messages } = options;
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada');
  }

  console.log('Generando respuesta con:', model);
  console.log('Mensajes:', messages.length);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error de OpenRouter:', error);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error en generateAIResponse:', error);
    throw error;
  }
}