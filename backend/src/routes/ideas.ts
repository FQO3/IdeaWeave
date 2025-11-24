import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { ideas, tags, ideasTags, links } from '../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { aiAnalysisWorker } from '../services/aiAnalysisWorker';

const router = Router();
router.use(authMiddleware);

// 创建灵感点（文本为主，预留多媒体）
router.post('/', async (req, res) => {
    try {
        const { content, type = 'TEXT', attachmentUrl, attachmentType } = req.body;
        const userId = (req as any).user.userId;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const id = uuidv4();
        
        // 立即创建笔记，不等待AI分析
        const [created] = await db.insert(ideas).values({
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
        aiAnalysisWorker.addToQueue({
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
        } catch (e) {
        console.error('Create idea error:', e);
        console.error('Error details:', JSON.stringify(e , null, 2));
        res.status(500).json({ error: 'Failed to create idea', details: e instanceof Error ? e.message : 'Unknown error' });
    }
});

// 获取用户所有灵感点，附带标签与入出边摘要
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const rows = await db.select().from(ideas)
            .where(eq(ideas.userId, userId))
            .orderBy(desc(ideas.createdAt));

        const ideaIds = rows.map(r => r.id);
        // 取标签
        const tagRows = ideaIds.length
            ? await db.select({
                ideaId: ideasTags.ideaId,
                tagId: tags.id, name: tags.name, color: tags.color
            })
                .from(ideasTags)
                .innerJoin(tags, eq(ideasTags.tagId, tags.id))
                .where(inArray(ideasTags.ideaId, ideaIds))
            : [];

        const tagsMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
        tagRows.forEach(tr => {
            const list = tagsMap.get(tr.ideaId) || [];
            list.push({ id: tr.tagId, name: tr.name, color: tr.color });
            tagsMap.set(tr.ideaId, list);
        });

        // 取链路（只做概览，不需要大量字段）
        const linksToRows = ideaIds.length
            ? await db.select().from(links).where(inArray(links.fromIdeaId, ideaIds))
            : [];
        const linksFromRows = ideaIds.length
            ? await db.select().from(links).where(inArray(links.toIdeaId, ideaIds))
            : [];

        const result = rows.map(r => ({
            ...r,
            tags: tagsMap.get(r.id) || [],
            linksTo: linksToRows.filter(l => l.fromIdeaId === r.id),
            linksFrom: linksFromRows.filter(l => l.toIdeaId === r.id),
        }));

        res.json(result);
    } catch (e) {
        console.error('Get ideas error:', e);
        res.status(500).json({ error: 'Failed to get ideas' });
    }
});

// 获取单个灵感点详情（含关联）
router.get('/:id', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const [idea] = await db.select().from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId))).limit(1);
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        const tRows = await db.select({
            ideaId: ideasTags.ideaId, tagId: tags.id, name: tags.name, color: tags.color
        }).from(ideasTags).innerJoin(tags, eq(ideasTags.tagId, tags.id)).where(eq(ideasTags.ideaId, id));

        const lTo = await db.select().from(links).where(eq(links.fromIdeaId, id));
        const lFrom = await db.select().from(links).where(eq(links.toIdeaId, id));

        res.json({ ...idea, tags: tRows.map(t => ({ id: t.tagId, name: t.name, color: t.color })), linksTo: lTo, linksFrom: lFrom });
    } catch (e) {
        console.error('Get idea error:', e);
        res.status(500).json({ error: 'Failed to get idea' });
    }
});

// 更新灵感点（仅内容）
router.patch('/:id', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { content } = req.body;

        const [exists] = await db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId))).limit(1);
        if (!exists) return res.status(404).json({ error: 'Idea not found' });

        const [updated] = await db.update(ideas).set({ content })
            .where(eq(ideas.id, id)).returning();

        res.json(updated);
    } catch (e) {
        console.error('Update idea error:', e);
        res.status(500).json({ error: 'Failed to update idea' });
    }
});

// 删除灵感点
router.delete('/:id', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const [exists] = await db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId))).limit(1);
        if (!exists) return res.status(404).json({ error: 'Idea not found' });

        await db.delete(ideas).where(eq(ideas.id, id));
        res.json({ success: true });
    } catch (e) {
        console.error('Delete idea error:', e);
        res.status(500).json({ error: 'Failed to delete idea' });
    }
});

// 创建一条链路（from :id → to targetId）
router.post('/:id/links', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { targetId, reason, strength = 0.5 } = req.body;
        if (!targetId) return res.status(400).json({ error: 'targetId is required' });

        const [[fromIdea], [toIdea]] = await Promise.all([
            db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId))).limit(1),
            db.select({ id: ideas.id }).from(ideas).where(and(eq(ideas.id, targetId), eq(ideas.userId, userId))).limit(1),
        ]);
        if (!fromIdea || !toIdea) return res.status(404).json({ error: 'Idea not found or not yours' });

        const linkId = uuidv4();
        try {
            const [created] = await db.insert(links).values({
                id: linkId, fromIdeaId: id, toIdeaId: targetId, reason: reason || null, strength
            }).returning();
            res.json(created);
        } catch (err: any) {
            if (err?.code === '23505') return res.status(409).json({ error: 'Link already exists' }); // unique violation
            throw err;
        }
    } catch (e) {
        console.error('Create link error:', e);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// 获取图谱数据
router.get('/graph/data', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const nodes = await db.select({
            id: ideas.id, label: ideas.summary, content: ideas.content, type: ideas.type, createdAt: ideas.createdAt
        }).from(ideas).where(eq(ideas.userId, userId));

        const ideaIds = nodes.map(n => n.id);
        const edges = ideaIds.length
            ? await db.select({
                source: links.fromIdeaId, target: links.toIdeaId, strength: links.strength, reason: links.reason
            }).from(links).where(inArray(links.fromIdeaId, ideaIds))
            : [];

        const finalNodes = nodes.map(n => ({
            id: n.id,
            label: n.label || (n.content ? n.content.slice(0, 50) : ''),
            content: n.content,
            type: n.type,
            createdAt: n.createdAt,
            tags: [] as string[], // 如需标签，在前端按需另取或这里扩展查询
        }));

        res.json({ nodes: finalNodes, links: edges });
    } catch (e) {
        console.error('Get graph error:', e);
        res.status(500).json({ error: 'Failed to get graph data' });
    }
});

// 获取AI分析状态
router.get('/:id/ai-status', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const [idea] = await db.select({
            id: ideas.id,
            aiAnalysisStatus: ideas.aiAnalysisStatus,
            aiAnalysisAttempts: ideas.aiAnalysisAttempts,
            lastAnalysisAttempt: ideas.lastAnalysisAttempt,
            summary: ideas.summary,
            title: ideas.title,
            category: ideas.category
        })
        .from(ideas)
        .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
        .limit(1);

        if (!idea) return res.status(404).json({ error: 'Idea not found' });

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
    } catch (e) {
        console.error('Get AI status error:', e);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// 手动触发AI分析
router.post('/:id/analyze', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const [idea] = await db.select({
            id: ideas.id,
            content: ideas.content,
            aiAnalysisStatus: ideas.aiAnalysisStatus
        })
        .from(ideas)
        .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
        .limit(1);

        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        // 重置状态为pending，重新加入队列
        await db.update(ideas)
            .set({
                aiAnalysisStatus: 'pending',
                aiAnalysisAttempts: 0,
                lastAnalysisAttempt: null,
                updatedAt: new Date()
            })
            .where(eq(ideas.id, id));

        // 加入分析队列
        aiAnalysisWorker.addToQueue({
            ideaId: id,
            content: idea.content,
            userId
        });

        res.json({ 
            success: true, 
            message: 'AI分析已重新加入队列' 
        });
    } catch (e) {
        console.error('Manual analyze error:', e);
        res.status(500).json({ error: 'Failed to trigger analysis' });
    }
});

export default router;
