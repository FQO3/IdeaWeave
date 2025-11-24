import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { tags, ideasTags, ideas } from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// 获取用户的所有标签
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        
        // 获取用户所有笔记的标签
        const userTags = await db.select({
            id: tags.id,
            name: tags.name,
            color: tags.color,
            createdAt: tags.createdAt
        })
        .from(tags)
        .innerJoin(ideasTags, eq(tags.id, ideasTags.tagId))
        .innerJoin(ideas, eq(ideasTags.ideaId, ideas.id))
        .where(eq(ideas.userId, userId))
        .groupBy(tags.id, tags.name, tags.color, tags.createdAt);

        res.json(userTags);
    } catch (e) {
        console.error('Get tags error:', e);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});

// 创建新标签
router.post('/', async (req, res) => {
    try {
        const { name, color = '#3b82f6' } = req.body;
        const userId = (req as any).user.userId;
        
        if (!name) return res.status(400).json({ error: 'Tag name is required' });

        // 检查标签是否已存在
        const [existingTag] = await db.select()
            .from(tags)
            .where(eq(tags.name, name))
            .limit(1);

        let tag;
        if (existingTag) {
            tag = existingTag;
        } else {
            // 创建新标签
            const id = uuidv4();
            [tag] = await db.insert(tags).values({
                id,
                name,
                color
            }).returning();
        }

        res.json(tag);
    } catch (e) {
        console.error('Create tag error:', e);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

// 为笔记添加标签
router.post('/:ideaId/tags', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { ideaId } = req.params;
        const { tagId } = req.body;
        
        if (!tagId) return res.status(400).json({ error: 'Tag ID is required' });

        // 验证笔记属于用户
        const [idea] = await db.select({ id: ideas.id })
            .from(ideas)
            .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
            .limit(1);
        
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        // 验证标签存在
        const [tag] = await db.select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1);
        
        if (!tag) return res.status(404).json({ error: 'Tag not found' });

        // 添加关联
        try {
            await db.insert(ideasTags).values({
                ideaId,
                tagId
            });
            
            res.json({ success: true, message: 'Tag added to idea' });
        } catch (err: any) {
            if (err?.code === '23505') {
                return res.status(409).json({ error: 'Tag already added to idea' });
            }
            throw err;
        }
    } catch (e) {
        console.error('Add tag to idea error:', e);
        res.status(500).json({ error: 'Failed to add tag to idea' });
    }
});

// 从笔记移除标签
router.delete('/:ideaId/tags/:tagId', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { ideaId, tagId } = req.params;

        // 验证笔记属于用户
        const [idea] = await db.select({ id: ideas.id })
            .from(ideas)
            .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
            .limit(1);
        
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        // 移除关联
        await db.delete(ideasTags)
            .where(and(eq(ideasTags.ideaId, ideaId), eq(ideasTags.tagId, tagId)));

        res.json({ success: true, message: 'Tag removed from idea' });
    } catch (e) {
        console.error('Remove tag from idea error:', e);
        res.status(500).json({ error: 'Failed to remove tag from idea' });
    }
});

// 获取笔记的所有标签
router.get('/:ideaId/tags', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { ideaId } = req.params;

        // 验证笔记属于用户
        const [idea] = await db.select({ id: ideas.id })
            .from(ideas)
            .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
            .limit(1);
        
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        // 获取笔记的所有标签
        const ideaTags = await db.select({
            id: tags.id,
            name: tags.name,
            color: tags.color
        })
        .from(tags)
        .innerJoin(ideasTags, eq(tags.id, ideasTags.tagId))
        .where(eq(ideasTags.ideaId, ideaId));

        res.json(ideaTags);
    } catch (e) {
        console.error('Get idea tags error:', e);
        res.status(500).json({ error: 'Failed to get idea tags' });
    }
});

export default router;