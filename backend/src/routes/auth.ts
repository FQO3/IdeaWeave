import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 注册
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const id = uuidv4();

        const [created] = await db.insert(users).values({
            id, email, password: hashed, name: name || null
        }).returning({ id: users.id, email: users.email, name: users.name });

        const token = jwt.sign({ userId: created.id, email: created.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({ token, user: created });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// 会话恢复
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };

        const [user] = await db.select({ id: users.id, email: users.email, name: users.name })
            .from(users).where(eq(users.id, decoded.userId)).limit(1);
        if (!user) return res.status(401).json({ error: 'Invalid token' });

        res.json({ user });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
