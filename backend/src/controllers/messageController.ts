import {Response} from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { generateAIResponse, DEFAULT_MODEL } from '../services/aiService';

const prisma = new PrismaClient();

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id: chatId } = req.params;
        const { content, model = DEFAULT_MODEL } = req.body;

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
        //Guardar mensaje
        const userMessage = await prisma.message.create({
            data: {
                chatId,
                role: 'user',
                content,
                model
            }
        });

        //
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const messages = [ 
         ...chat.messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content
        })),
        { role: 'user' as const, content }];

        let fullResponse = '';

        //Generar respuesta AI
        const result = await generateAIResponse({
            model,
            messages,
        });
        
        //Stream token
        for await (const chunk of result.textStream) {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
        }

        //Guardar mensaje de asistente
        const assistantMessage = await prisma.message.create({
            data: {
                chatId,
                role: 'assistant',
                content: fullResponse,
                model
            }
        });

        //Actualizar titulo de chat
        if (chat.messages.length === 0) {
            const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            await prisma.chat.update({
                where: { id: chatId },
                data: { title }
            });
        }

        res.write(`data: ${JSON.stringify({ done: true, message: assistantMessage })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try{
        const { id, chatId } = req.params;
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
            where: { chatId: id },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};