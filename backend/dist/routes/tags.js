"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// 获取用户的所有标签
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        // 获取用户所有笔记的标签
        const userTags = await db_1.db.select({
            id: schema_1.tags.id,
            name: schema_1.tags.name,
            color: schema_1.tags.color,
            createdAt: schema_1.tags.createdAt
        })
            .from(schema_1.tags)
            .innerJoin(schema_1.ideasTags, (0, drizzle_orm_1.eq)(schema_1.tags.id, schema_1.ideasTags.tagId))
            .innerJoin(schema_1.ideas, (0, drizzle_orm_1.eq)(schema_1.ideasTags.ideaId, schema_1.ideas.id))
            .where((0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId))
            .groupBy(schema_1.tags.id, schema_1.tags.name, schema_1.tags.color, schema_1.tags.createdAt);
        res.json(userTags);
    }
    catch (e) {
        console.error('Get tags error:', e);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});
// 创建新标签
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId;
        if (!name)
            return res.status(400).json({ error: 'Tag name is required' });
        // 检查标签是否已存在
        const [existingTag] = await db_1.db.select()
            .from(schema_1.tags)
            .where((0, drizzle_orm_1.eq)(schema_1.tags.name, name))
            .limit(1);
        let tag;
        if (existingTag) {
            tag = existingTag;
        }
        else {
            // 创建新标签
            const id = (0, uuid_1.v4)();
            [tag] = await db_1.db.insert(schema_1.tags).values({
                id,
                name,
                color: '#3b82f6'
            }).returning();
        }
        res.json(tag);
    }
    catch (e) {
        console.error('Create tag error:', e);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});
// 为笔记添加标签
router.post('/:ideaId/tags', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { ideaId } = req.params;
        const { tagId } = req.body;
        if (!tagId)
            return res.status(400).json({ error: 'Tag ID is required' });
        // 验证笔记属于用户
        const [idea] = await db_1.db.select({ id: schema_1.ideas.id })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId)))
            .limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        // 验证标签存在
        const [tag] = await db_1.db.select()
            .from(schema_1.tags)
            .where((0, drizzle_orm_1.eq)(schema_1.tags.id, tagId))
            .limit(1);
        if (!tag)
            return res.status(404).json({ error: 'Tag not found' });
        // 添加关联
        try {
            await db_1.db.insert(schema_1.ideasTags).values({
                ideaId,
                tagId
            });
            res.json({ success: true, message: 'Tag added to idea' });
        }
        catch (err) {
            if (err?.code === '23505') {
                return res.status(409).json({ error: 'Tag already added to idea' });
            }
            throw err;
        }
    }
    catch (e) {
        console.error('Add tag to idea error:', e);
        res.status(500).json({ error: 'Failed to add tag to idea' });
    }
});
// 从笔记移除标签
router.delete('/:ideaId/tags/:tagId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { ideaId, tagId } = req.params;
        // 验证笔记属于用户
        const [idea] = await db_1.db.select({ id: schema_1.ideas.id })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId)))
            .limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        // 移除关联
        await db_1.db.delete(schema_1.ideasTags)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideasTags.ideaId, ideaId), (0, drizzle_orm_1.eq)(schema_1.ideasTags.tagId, tagId)));
        res.json({ success: true, message: 'Tag removed from idea' });
    }
    catch (e) {
        console.error('Remove tag from idea error:', e);
        res.status(500).json({ error: 'Failed to remove tag from idea' });
    }
});
// 获取笔记的所有标签
router.get('/:ideaId/tags', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { ideaId } = req.params;
        // 验证笔记属于用户
        const [idea] = await db_1.db.select({ id: schema_1.ideas.id })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId), (0, drizzle_orm_1.eq)(schema_1.ideas.userId, userId)))
            .limit(1);
        if (!idea)
            return res.status(404).json({ error: 'Idea not found' });
        // 获取笔记的所有标签
        const ideaTags = await db_1.db.select({
            id: schema_1.tags.id,
            name: schema_1.tags.name,
            color: schema_1.tags.color
        })
            .from(schema_1.tags)
            .innerJoin(schema_1.ideasTags, (0, drizzle_orm_1.eq)(schema_1.tags.id, schema_1.ideasTags.tagId))
            .where((0, drizzle_orm_1.eq)(schema_1.ideasTags.ideaId, ideaId));
        res.json(ideaTags);
    }
    catch (e) {
        console.error('Get idea tags error:', e);
        res.status(500).json({ error: 'Failed to get idea tags' });
    }
});
exports.default = router;
