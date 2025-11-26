"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// 注册
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: '需要提供电子邮箱和密码' });
        const existing = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (existing.length > 0)
            return res.status(400).json({ error: '当前用户已存在' });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const id = (0, uuid_1.v4)();
        const [created] = await db_1.db.insert(schema_1.users).values({
            id, email, password: hashed, name: name || null
        }).returning({ id: schema_1.users.id, email: schema_1.users.email, name: schema_1.users.name });
        const token = jsonwebtoken_1.default.sign({ userId: created.id, email: created.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: created });
    }
    catch (e) {
        console.error('注册失败:', e);
        res.status(500).json({ error: '注册失败e:500' });
    }
});
// 登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (!user)
            return res.status(401).json({ error: '用户名密码错误' });
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ error: '用户名密码错误' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (e) {
        console.error('登录失败:', e);
        res.status(500).json({ error: '登陆失败e:500' });
    }
});
// 会话恢复
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'No token' });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const [user] = await db_1.db.select({ id: schema_1.users.id, email: schema_1.users.email, name: schema_1.users.name })
            .from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId)).limit(1);
        if (!user)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ user });
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
