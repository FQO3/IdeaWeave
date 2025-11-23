import { pgTable, text, varchar, timestamp, real, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const ideaType = pgEnum('idea_type', ['TEXT', 'VOICE', 'IMAGE', 'VIDEO']);
export const attachmentType = pgEnum('attachment_type', ['AUDIO', 'IMAGE', 'VIDEO']);

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    emailIdx: uniqueIndex('users_email_uk').on(t.email),
}));

export const ideas = pgTable('ideas', {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    summary: text('summary'),
    type: ideaType('type').default('TEXT').notNull(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    attachmentUrl: text('attachment_url'),
    attachmentType: attachmentType('attachment_type'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    userIdx: index('ideas_user_idx').on(t.userId),
    createdIdx: index('ideas_created_idx').on(t.createdAt),
}));

export const tags = pgTable('tags', {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 32 }).default('#3b82f6').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    nameUk: uniqueIndex('tags_name_uk').on(t.name),
}));

export const ideasTags = pgTable('ideas_tags', {
    ideaId: text('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: uniqueIndex('ideas_tags_uk').on(t.ideaId, t.tagId),
    ideaIdx: index('ideas_tags_idea_idx').on(t.ideaId),
    tagIdx: index('ideas_tags_tag_idx').on(t.tagId),
}));

export const links = pgTable('links', {
    id: text('id').primaryKey(),
    fromIdeaId: text('from_idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    toIdeaId: text('to_idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
    strength: real('strength').default(0.5).notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    fromIdx: index('links_from_idx').on(t.fromIdeaId),
    toIdx: index('links_to_idx').on(t.toIdeaId),
    uniq: uniqueIndex('links_uniq_from_to').on(t.fromIdeaId, t.toIdeaId),
}));
