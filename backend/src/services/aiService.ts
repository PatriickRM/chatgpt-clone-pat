export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface StreamOptions {
  model?: string;
  messages: AIMessage[];
}

export const AVAILABLE_MODELS = [
  { 
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    provider: 'Meta',
    vision: false
  },
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Gemini 2.0 Flash 🖼️',
    provider: 'Google',
    vision: true
  },
  { 
    id: 'deepseek/deepseek-chat-v3.1:free', 
    name: 'DeepSeek Chat V3.1',
    provider: 'DeepSeek',
    vision: false
  },
  { 
    id: 'qwen/qwen2.5-vl-32b-instruct:free', 
    name: 'Qwen 2.5 VL 32B 🖼️',
    provider: 'Qwen',
    vision: true
  },
  { 
    id: 'nvidia/nemotron-nano-12b-v2-vl:free', 
    name: 'Nemotron Nano 12B VL 🖼️',
    provider: 'NVIDIA',
    vision: true
  },
  { 
    id: 'meta-llama/llama-4-maverick:free', 
    name: 'Llama 4 Maverick 🖼️',
    provider: 'Meta',
    vision: true
  }
];

export const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';



export async function* generateAIResponse(options: StreamOptions): AsyncGenerator<string> {
  const { model = DEFAULT_MODEL, messages } = options;
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada');
  }

  console.log('Generando respuesta con:', model);
  console.log('Mensajes:', messages.length);
  const formattedMessages = messages.map(msg => {
    if (Array.isArray(msg.content)) {
      return {
        role: msg.role,
        content: msg.content
      };
    }
    //Si es texto simple
    return {
      role: msg.role,
      content: msg.content
    };
  });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
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

export async function generateChatTitle(userMessage: string,assistantResponse: string): Promise<string> {
  //Lista de mensajes genéricos que no merecen un título especial
  const genericMessages = [
    'hola', 'hey', 'buenas', 'buenos días', 'buenas tardes', 
    'buenas noches', 'hi', 'hello', 'que tal', 'qué tal',
    'como estas', 'cómo estás', 'saludos'];

  const normalizedMessage = userMessage.toLowerCase().trim();
  
  //Si es un mensaje muy genérico, devolver "Nuevo Chat"
  if (genericMessages.some(g => normalizedMessage === g || normalizedMessage.startsWith(g))) {
    return 'Nuevo Chat';
  }

  //Si el mensaje es muy corto
  if (userMessage.length < 10) {
    return 'Nuevo Chat';
  }

  try {
    //Crear un prompt para que la IA genere el título
    const titlePrompt = `Basándote en este mensaje del usuario: "${userMessage.slice(0, 200)}"

      Genera un título corto y descriptivo para este chat. El título debe:
      - Tener máximo 4 palabras
      - Capturar el tema principal
      - NO usar artículos innecesarios (el, la, los, las, un, una)
      - Ser claro y directo

      Ejemplos buenos:
      "¿Cómo hacer una pizza?" → "Receta Pizza"
      "Tengo un error en Java con arrays" → "Error Arrays Java"
      "Explícame qué es React" → "Aprendiendo React"
      "¿Cuándo se fundó Roma?" → "Historia Roma"
      "Dame consejos para estudiar" → "Consejos Estudio"

      Responde SOLO con el título, sin comillas, sin puntos, sin explicaciones adicionales.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'PatGPT'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'user', content: titlePrompt }
        ],
        max_tokens: 30,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };
    let title = data.choices[0]?.message?.content?.trim() || '';

    //Limpiar el título
    title = title
      .replace(/['"`.]/g, '') //Quitar comillas y puntos
      .replace(/\n/g, ' ') //Reemplazar saltos de línea
      .trim();

    //Si el título es muy largo, truncarlo
    if (title.length > 50) {
      title = title.slice(0, 47) + '...';
    }

    //Si quedó vacío después de limpiar, usar fallback
    if (!title || title.length < 3) {
      return userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '');
    }

    return title;

  } catch (error) {
    console.error('Error generando título:', error);
    return userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '');
  }
}