import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RegisterDTO, LoginDTO, AuthRequest } from '../types';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name }: RegisterDTO = req.body;

    //Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son necesarios' });
    }

    if (password.length < 7) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 7 caracteres' });
    }

    //Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    //Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    //Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      }
    });

    // Generar token
    const token = generateToken({ userId: user.id });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error de registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDTO = req.body;

    //Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseño son necesarios' });
    }

    //Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    //Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // Generar token
    const token = generateToken({ userId: user.id });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error de Login:', error);
    res.status(500).json({ error: 'Error al Loguear' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};
