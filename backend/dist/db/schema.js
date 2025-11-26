"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.links = exports.ideasTags = exports.tags = exports.ideas = exports.users = exports.ideaCategory = exports.attachmentType = exports.ideaType = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.ideaType = (0, pg_core_1.pgEnum)('idea_type', ['TEXT', 'VOICE', 'IMAGE', 'VIDEO']);
exports.attachmentType = (0, pg_core_1.pgEnum)('attachment_type', ['AUDIO', 'IMAGE', 'VIDEO']);
// 添加新的分类枚举
exports.ideaCategory = (0, pg_core_1.pgEnum)('idea_category', ['TODO', 'PLAN', 'INSPIRATION']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (t) => ({
    emailIdx: (0, pg_core_1.uniqueIndex)('users_email_uk').on(t.email),
}));
exports.ideas = (0, pg_core_1.pgTable)('ideas', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    content: (0, pg_core_1.text)('content').notNull(),
    summary: (0, pg_core_1.text)('summary'),
    type: (0, exports.ideaType)('type').default('TEXT').notNull(),
    category: (0, exports.ideaCategory)('category').default('INSPIRATION').notNull(), // 新增：AI分类
    title: (0, pg_core_1.text)('title'), // 新增：AI生成的标题
    userId: (0, pg_core_1.text)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    attachmentUrl: (0, pg_core_1.text)('attachment_url'),
    attachmentType: (0, exports.attachmentType)('attachment_type'),
    aiAnalysisStatus: (0, pg_core_1.varchar)('ai_analysis_status', { length: 32 }).default('pending').notNull(), // 新增：AI分析状态
    aiAnalysisAttempts: (0, pg_core_1.integer)('ai_analysis_attempts').default(0).notNull(), // 新增：分析尝试次数
    lastAnalysisAttempt: (0, pg_core_1.timestamp)('last_analysis_attempt'), // 新增：最后分析尝试时间
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (t) => ({
    userIdx: (0, pg_core_1.index)('ideas_user_idx').on(t.userId),
    createdIdx: (0, pg_core_1.index)('ideas_created_idx').on(t.createdAt),
    categoryIdx: (0, pg_core_1.index)('ideas_category_idx').on(t.category), // 新增：分类索引
    aiStatusIdx: (0, pg_core_1.index)('ideas_ai_status_idx').on(t.aiAnalysisStatus), // 新增：AI状态索引
}));
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    color: (0, pg_core_1.varchar)('color', { length: 32 }).default('#3b82f6').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (t) => ({
    nameUk: (0, pg_core_1.uniqueIndex)('tags_name_uk').on(t.name),
}));
exports.ideasTags = (0, pg_core_1.pgTable)('ideas_tags', {
    ideaId: (0, pg_core_1.text)('idea_id').notNull().references(() => exports.ideas.id, { onDelete: 'cascade' }),
    tagId: (0, pg_core_1.text)('tag_id').notNull().references(() => exports.tags.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: (0, pg_core_1.uniqueIndex)('ideas_tags_uk').on(t.ideaId, t.tagId),
    ideaIdx: (0, pg_core_1.index)('ideas_tags_idea_idx').on(t.ideaId),
    tagIdx: (0, pg_core_1.index)('ideas_tags_tag_idx').on(t.tagId),
}));
exports.links = (0, pg_core_1.pgTable)('links', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    fromIdeaId: (0, pg_core_1.text)('from_idea_id').notNull().references(() => exports.ideas.id, { onDelete: 'cascade' }),
    toIdeaId: (0, pg_core_1.text)('to_idea_id').notNull().references(() => exports.ideas.id, { onDelete: 'cascade' }),
    strength: (0, pg_core_1.real)('strength').default(0.5).notNull(),
    reason: (0, pg_core_1.text)('reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (t) => ({
    fromIdx: (0, pg_core_1.index)('links_from_idx').on(t.fromIdeaId),
    toIdx: (0, pg_core_1.index)('links_to_idx').on(t.toIdeaId),
    uniq: (0, pg_core_1.uniqueIndex)('links_uniq_from_to').on(t.fromIdeaId, t.toIdeaId),
}));
