import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { generateAIResponse, DEFAULT_MODEL, AVAILABLE_MODELS, generateChatTitle } from '../services/aiService';

const prisma = new PrismaClient();

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;
    const { content, model = DEFAULT_MODEL, images = [] } = req.body;

    console.log('📩 Recibiendo mensaje:', { chatId, content, model, imagesCount: images.length });

    // Validar si el modelo soporta imágenes
    if (images.length > 0) {
      const modelInfo = AVAILABLE_MODELS.find(m => m.id === model);
      if (!modelInfo?.vision) {
        return res.status(400).json({ 
          error: 'El modelo seleccionado no soporta imágenes. Por favor selecciona un modelo con visión.' 
        });
      }
    }

    // Verificar que el chat pertenece al usuario
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: req.userId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // 🎯 Verificar si es el primer mensaje
    const isFirstMessage = chat.messages.length === 0;

    // Guardar mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content,
        model,
        images: images
      }
    });

    console.log('✅ Mensaje del usuario guardado:', userMessage.id);

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Preparar mensajes para la IA
    const messages = [
      ...chat.messages.map(msg => {
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content: [
              { type: 'text' as const, text: msg.content },
              ...msg.images.map(img => ({
                type: 'image_url' as const,
                image_url: { url: img }
              }))
            ]
          };
        }
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        };
      }),
      // Mensaje actual
      images.length > 0 ? {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: content },
          ...images.map((img: string) => ({
            type: 'image_url' as const,
            image_url: { url: img }
          }))
        ]
      } : {
        role: 'user' as const,
        content
      }
    ];

    let fullResponse = '';

    console.log('🤖 Generando respuesta AI...');

    try {
      // Generar respuesta con streaming
      const stream = generateAIResponse({
        model,
        messages
      });

      // Stream tokens al cliente
      for await (const chunk of stream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      console.log('✅ Respuesta AI completa');

      // Guardar mensaje del asistente
      const assistantMessage = await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: fullResponse,
          model,
          images: []
        }
      });

      // 🔥 AUTO-NAMING: Generar título si es el primer mensaje
      if (isFirstMessage) {
        console.log('📝 Generando título automático...');
        try {
          const newTitle = await generateChatTitle(content, fullResponse);
          await prisma.chat.update({
            where: { id: chatId },
            data: { title: newTitle }
          });
          console.log('✅ Título generado:', newTitle);
        } catch (titleError) {
          console.error('⚠️ Error generando título, usando fallback:', titleError);
          // Fallback: usar el contenido truncado
          const fallbackTitle = content.slice(0, 40) + (content.length > 40 ? '...' : '');
          await prisma.chat.update({
            where: { id: chatId },
            data: { title: fallbackTitle }
          });
        }
      }

      // Enviar mensaje final con el ID
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        message: assistantMessage 
      })}\n\n`);

      res.end();
    } catch (aiError) {
      console.error('❌ Error generando respuesta AI:', aiError);
      res.write(`data: ${JSON.stringify({ 
        error: 'Error generando respuesta. Por favor intenta de nuevo.' 
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('❌ Error en sendMessage:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error del servidor' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Error del servidor' })}\n\n`);
      res.end();
    }
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;
    
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: req.userId
      }
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
