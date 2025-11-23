import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { ideas, tags, ideasTags, links } from '../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// 创建灵感点（文本为主，预留多媒体）
router.post('/', async (req, res) => {
    try {
        const { content, type = 'TEXT', attachmentUrl, attachmentType } = req.body;
        const userId = (req as any).user.userId;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const id = uuidv4();
        const [created] = await db.insert(ideas).values({
            id, content, type, userId, attachmentUrl: attachmentUrl || null, attachmentType: attachmentType || null
        }).returning();

        // 初期不做 AI，先返回创建结果
        res.json({ ...created, tags: [], linksTo: [], linksFrom: [] });
    } catch (e) {
        console.error('Create idea error:', e);
        res.status(500).json({ error: 'Failed to create idea' });
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

export default router;
