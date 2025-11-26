"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const aiAnalysisWorker_1 = require("../services/aiAnalysisWorker");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// 创建灵感点（文本为主，预留多媒体）
router.post('/', async (req, res) => {
    try {
        const { content, type = 'TEXT', attachmentUrl, attachmentType } = req.body;
        const userId = req.user.userId;
        if (!content)
            return res.status(400).json({ error: 'Content is required' });
        const id = (0, uuid_1.v4)();
        // 立即创建笔记，不等待AI分析
        const [created] = await db_1.db.insert(schema_1.ideas).values({
            id,
            content,
            type,
            userId,
            summary: null, // AI分析完成后再设置
            category: 'INSPIRATION', // 默认分类
            title: null, // AI分析完成后再设置
            attachmentUrl: attachmentUrl || null,
            attachmentType: attachmentType || null,
            aiAnalysisStatus: 'pending', // 标记为待分析
            aiAnalysisAttempts: 0
        }).returning();
        // 将AI分析任务加入后台队列
        aiAnalysisWorker_1.aiAnalysisWorker.addToQueue({
            ideaId: id,
            content,
            userId
        });
        // 立即返回创建结果，不等待AI分析
        res.json({
            ...created,
            tags: [],
            linksTo: [],
            linksFrom: [],
            aiAnalysis: {
                status: 'pending',
                message: 'AI分析正在后台进行，稍后刷新查看结果'
            }
        });
    }
    catch (e) {
        console.error('Create idea error:', e);
        console.error('Error details:', JSON.stringify(e, null, 2));
        res.status(500).json({ error: 'Failed to create idea', details: e instanceof Error ? e.message : 'Unknown error' });
    }
});
// 获取用户所有灵感点，附带标签与入出边摘要
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const rows = await db_1.db.select().from(schema_1.ideas)
            .where((0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.ideas.createdAt));
        const ideaIds = rows.map(r => r.id);
        // 取标签
        const tagRows = ideaIds.length
            ? await db_1.db.select({
                ideaId: schema_1.ideasTags.ideaId,
                tagId: schema_1.tags.id, name: schema_1.tags.name, color: schema_1.tags.color
            })
                .from(schema_1.ideasTags)
                .innerJoin(schema_1.tags, (0, drizzle_orm_1.eq)(schema_1.ideasTags.tagId, schema_1.tags.id))
                .where((0, drizzle_orm_1.inArray)(schema_1.ideasTags.ideaId, ideaIds))
            : [];
        const tagsMap = new Map();
        tagRows.forEach(tr => {
            const list = tagsMap.get(tr.ideaId) || [];
            list.push({ id: tr.tagId, name: tr.name, color: tr.color });
            tagsMap.set(tr.ideaId, list);
        });
        // 取链路（只做概览，不需要大量字段）
        const linksToRows = ideaIds.length
            ? await db_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.inArray)(schema_1.links.fromIdeaId, ideaIds))
            : [];
        const linksFromRows = ideaIds.length
            ? await db_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.inArray)(schema_1.links.toIdeaId, ideaIds))
            : [];
        const result = rows.map(r => ({
            ...r,
            tags: tagsMap.get(r.id) || [],
            linksTo: linksToRows.filter(l => l.fromIdeaId === r.id),
            linksFrom: linksFromRows.filter(l => l.toIdeaId === r.id),
        }));
        res.json(result);
    }
    catch (e) {
        console.error('Get ideas error:', e);
        res.status(500).json({ error: 'Failed to get ideas' });
    }
});
// 获取单个灵感点详情（含关联）
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const [idea] = await db_1.db.select().from(schema_1.ideas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))).limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        const tRows = await db_1.db.select({
            ideaId: schema_1.ideasTags.ideaId, tagId: schema_1.tags.id, name: schema_1.tags.name, color: schema_1.tags.color
        }).from(schema_1.ideasTags).innerJoin(schema_1.tags, (0, drizzle_orm_1.eq)(schema_1.ideasTags.tagId, schema_1.tags.id)).where((0, drizzle_orm_1.eq)(schema_1.ideasTags.ideaId, id));
        const lTo = await db_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.eq)(schema_1.links.fromIdeaId, id));
        const lFrom = await db_1.db.select().from(schema_1.links).where((0, drizzle_orm_1.eq)(schema_1.links.toIdeaId, id));
        res.json({ ...idea, tags: tRows.map(t => ({ id: t.tagId, name: t.name, color: t.color })), linksTo: lTo, linksFrom: lFrom });
    }
    catch (e) {
        console.error('Get idea error:', e);
        res.status(500).json({ error: 'Failed to get idea' });
    }
});
// 更新灵感点（内容、标题、摘要、分类）
router.patch('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { content, title, summary, category } = req.body;
        const [exists] = await db_1.db.select({ id: schema_1.ideas.id }).from(schema_1.ideas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))).limit(1);
        if (!exists)
            return res.status(404).json({ error: 'Idea not found' });
        // 构建更新对象
        const updateData = {};
        if (content !== undefined)
            updateData.content = content;
        if (title !== undefined)
            updateData.title = title;
        if (summary !== undefined)
            updateData.summary = summary;
        if (category !== undefined)
            updateData.category = category;
        // 如果没有要更新的字段，返回错误
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updateData.updatedAt = new Date();
        const [updated] = await db_1.db.update(schema_1.ideas).set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.ideas.id, id)).returning();
        res.json(updated);
    }
    catch (e) {
        console.error('Update idea error:', e);
        res.status(500).json({ error: 'Failed to update idea' });
    }
});
// 删除灵感点
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const [exists] = await db_1.db.select({ id: schema_1.ideas.id }).from(schema_1.ideas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))).limit(1);
        if (!exists)
            return res.status(404).json({ error: 'Idea not found' });
        await db_1.db.delete(schema_1.ideas).where((0, drizzle_orm_1.eq)(schema_1.ideas.id, id));
        res.json({ success: true });
    }
    catch (e) {
        console.error('Delete idea error:', e);
        res.status(500).json({ error: 'Failed to delete idea' });
    }
});
// 创建一条链路（from :id → to targetId）
router.post('/:id/links', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { targetId, reason, strength = 0.5 } = req.body;
        if (!targetId)
            return res.status(400).json({ error: 'targetId is required' });
        const [[fromIdea], [toIdea]] = await Promise.all([
            db_1.db.select({ id: schema_1.ideas.id }).from(schema_1.ideas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))).limit(1),
            db_1.db.select({ id: schema_1.ideas.id }).from(schema_1.ideas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, targetId), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))).limit(1),
        ]);
        if (!fromIdea || !toIdea)
            return res.status(404).json({ error: 'Idea not found or not yours' });
        const linkId = (0, uuid_1.v4)();
        try {
            const [created] = await db_1.db.insert(schema_1.links).values({
                id: linkId, fromIdeaId: id, toIdeaId: targetId, reason: reason || null, strength
            }).returning();
            res.json(created);
        }
        catch (err) {
            if (err?.code === '23505')
                return res.status(409).json({ error: 'Link already exists' }); // unique violation
            throw err;
        }
    }
    catch (e) {
        console.error('Create link error:', e);
        res.status(500).json({ error: 'Failed to create link' });
    }
});
// 获取图谱数据
router.get('/graph/data', async (req, res) => {
    try {
        const userId = req.user.userId;
        const nodes = await db_1.db.select({
            id: schema_1.ideas.id, label: schema_1.ideas.summary, content: schema_1.ideas.content, type: schema_1.ideas.type, createdAt: schema_1.ideas.createdAt
        }).from(schema_1.ideas).where((0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId));
        const ideaIds = nodes.map(n => n.id);
        const edges = ideaIds.length
            ? await db_1.db.select({
                source: schema_1.links.fromIdeaId, target: schema_1.links.toIdeaId, strength: schema_1.links.strength, reason: schema_1.links.reason
            }).from(schema_1.links).where((0, drizzle_orm_1.inArray)(schema_1.links.fromIdeaId, ideaIds))
            : [];
        const finalNodes = nodes.map(n => ({
            id: n.id,
            label: n.label || (n.content ? n.content.slice(0, 50) : ''),
            content: n.content,
            type: n.type,
            createdAt: n.createdAt,
            tags: [], // 如需标签，在前端按需另取或这里扩展查询
        }));
        res.json({ nodes: finalNodes, links: edges });
    }
    catch (e) {
        console.error('Get graph error:', e);
        res.status(500).json({ error: 'Failed to get graph data' });
    }
});
// 获取AI分析状态
router.get('/:id/ai-status', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const [idea] = await db_1.db.select({
            id: schema_1.ideas.id,
            aiAnalysisStatus: schema_1.ideas.aiAnalysisStatus,
            aiAnalysisAttempts: schema_1.ideas.aiAnalysisAttempts,
            lastAnalysisAttempt: schema_1.ideas.lastAnalysisAttempt,
            summary: schema_1.ideas.summary,
            title: schema_1.ideas.title,
            category: schema_1.ideas.category
        })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId)))
            .limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        res.json({
            status: idea.aiAnalysisStatus,
            attempts: idea.aiAnalysisAttempts,
            lastAttempt: idea.lastAnalysisAttempt,
            hasAnalysis: !!idea.summary && !!idea.title,
            analysis: idea.summary ? {
                title: idea.title,
                category: idea.category
            } : null
        });
    }
    catch (e) {
        console.error('Get AI status error:', e);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});
// 手动触发AI分析
router.post('/:id/analyze', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const [idea] = await db_1.db.select({
            id: schema_1.ideas.id,
            content: schema_1.ideas.content,
            aiAnalysisStatus: schema_1.ideas.aiAnalysisStatus
        })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, id), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId)))
            .limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        // 重置状态为pending，重新加入队列
        await db_1.db.update(schema_1.ideas)
            .set({
            aiAnalysisStatus: 'pending',
            aiAnalysisAttempts: 0,
            lastAnalysisAttempt: null,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.ideas.id, id));
        // 加入分析队列
        aiAnalysisWorker_1.aiAnalysisWorker.addToQueue({
            ideaId: id,
            content: idea.content,
            userId
        });
        res.json({
            success: true,
            message: 'AI分析已重新加入队列'
        });
    }
    catch (e) {
        console.error('Manual analyze error:', e);
        res.status(500).json({ error: 'Failed to trigger analysis' });
    }
});
exports.default = router;
