-- 添加AI分析状态字段到ideas表
ALTER TABLE ideas ADD COLUMN ai_analysis_status VARCHAR(32) DEFAULT 'pending' NOT NULL;
ALTER TABLE ideas ADD COLUMN ai_analysis_attempts INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE ideas ADD COLUMN last_analysis_attempt TIMESTAMP;

-- 创建索引以优化查询
CREATE INDEX idx_ideas_ai_status ON ideas(ai_analysis_status);
CREATE INDEX idx_ideas_analysis_pending ON ideas(ai_analysis_status, ai_analysis_attempts) WHERE ai_analysis_status = 'pending';

-- 更新现有记录的默认值
UPDATE ideas SET ai_analysis_status = 'completed' WHERE summary IS NOT NULL AND title IS NOT NULL;
UPDATE ideas SET ai_analysis_status = 'failed' WHERE summary IS NULL AND title IS NULL AND created_at < NOW() - INTERVAL '1 hour';