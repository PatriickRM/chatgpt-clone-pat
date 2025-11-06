// ============================================
// backend/src/controllers/messageController.ts - CORREGIDO
// ============================================
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { generateAIResponse, DEFAULT_MODEL } from '../services/aiService';

const prisma = new PrismaClient();

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;
    const { content, model = DEFAULT_MODEL } = req.body;

    console.log(' Recibiendo mensaje:', { chatId, content, model });

    //Verificar que el chat pertenece al usuario
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

    //Guardar mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content,
        model
      }
    });

    console.log('Mensaje del usuario guardado:', userMessage.id);

    //Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    //Preparar mensajes para la IA
    const messages = [
      ...chat.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      { role: 'user' as const, content }
    ];

    let fullResponse = '';

    console.log('Generando respuesta AI...');

    try {
      // Generar respuesta con streaming
      const stream = generateAIResponse({
        model,
        messages
      });

      //Stream tokens al cliente
      for await (const chunk of stream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      console.log('Respuesta AI completa:', fullResponse.substring(0, 50) + '...');

      // Guardar mensaje del asistente
      const assistantMessage = await prisma.message.create({
        data: {
          chatId,
          role: 'assistant',
          content: fullResponse,
          model
        }
      });

      //Actualizar título del chat si es el primer mensaje
      if (chat.messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await prisma.chat.update({
          where: { id: chatId },
          data: { title }
        });
      }

      //Enviar mensaje final con el ID
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        message: assistantMessage 
      })}\n\n`);

      res.end();
    } catch (aiError) {
      console.error('Error generando respuesta AI:', aiError);
      res.write(`data: ${JSON.stringify({ 
        error: 'Error generando respuesta. Por favor intenta de nuevo.' 
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error en sendMessage:', error);
    
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