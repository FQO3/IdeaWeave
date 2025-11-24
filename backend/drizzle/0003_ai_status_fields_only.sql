-- Add AI analysis status fields only
ALTER TABLE "ideas" 
ADD COLUMN "ai_analysis_status" varchar(32) DEFAULT 'pending' NOT NULL,
ADD COLUMN "ai_analysis_attempts" integer DEFAULT 0 NOT NULL,
ADD COLUMN "last_analysis_attempt" timestamp;

-- Add index for AI analysis status field
CREATE INDEX "ideas_ai_status_idx" ON "ideas" USING btree ("ai_analysis_status");

-- Update existing records with default values
UPDATE "ideas" SET "ai_analysis_status" = 'completed' WHERE "summary" IS NOT NULL AND "title" IS NOT NULL;
UPDATE "ideas" SET "ai_analysis_status" = 'failed' WHERE "summary" IS NULL AND "title" IS NULL AND "created_at" < NOW() - INTERVAL '1 hour';