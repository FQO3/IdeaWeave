-- 添加新的分类枚举
CREATE TYPE "public"."idea_category" AS ENUM('TODO', 'PLAN', 'INSPIRATION');

-- 为ideas表添加AI分析字段
ALTER TABLE "ideas" 
ADD COLUMN "category" "idea_category" DEFAULT 'INSPIRATION' NOT NULL,
ADD COLUMN "title" text;

-- 为category字段添加索引
CREATE INDEX "ideas_category_idx" ON "ideas" USING btree ("category");