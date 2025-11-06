import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { Response } from 'express';

const prisma = new PrismaClient();

export const getChats = async (req: AuthRequest, res: Response) => {
    try {
        const chats = await prisma.chat.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json({chats});
    } catch (error) {
        console.error('Error obteniendo chats:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const createChat = async (req: AuthRequest, res: Response) => {
    try{
        const { title } = req.body;

        const chat = await prisma.chat.create({
            data: {
                title: title || 'Nuevo Chat',
                userId: req.userId!
            }
    });
        res.status(201).json({chat});
    } catch (error) {
        console.error('Error creando chat:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const getChat = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const chat = await prisma.chat.findFirst({
            where: {
                id,
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
        
        res.json({chat});

        } catch (error) {
            console.error('Error obteniendo chat:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.chat.deleteMany({
            where: {
                id,
                userId: req.userId
            }
        });
        res.status(204).send();

    } catch (error) {
        console.error('Error eliminando chat:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const updateChatTitle = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const chat = await prisma.chat.findFirst({
            where: {
                id,
                userId: req.userId
            }
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }
        
        const updatedChat = await prisma.chat.update({
            where: { id: chat.id },
            data: { title }
        });
        res.json(updatedChat);
    } catch (error) {
        console.error('Error actualizando título del chat:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};