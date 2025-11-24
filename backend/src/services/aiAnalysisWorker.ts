import { db } from '../db';
import { ideas, links, tags, ideasTags } from '../db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { deepSeekService } from './deepseek';

interface AnalysisTask {
  ideaId: string;
  content: string;
  userId: string;
}

export class AIAnalysisWorker {
  private isRunning = false;
  private processingQueue: AnalysisTask[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    console.log('AI Analysis Worker initialized');
  }

  async start() {
    if (this.isRunning) {
      console.log('AI Analysis Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting AI Analysis Worker...');

    // 启动时处理积压的任务
    await this.processBacklog();

    // 设置定时任务
    setInterval(() => {
      this.processQueue();
    }, 10000); // 每10秒处理一次

    // 设置积压处理定时任务
    setInterval(() => {
      this.processBacklog();
    }, 60000); // 每分钟检查一次积压任务
  }

  async stop() {
    this.isRunning = false;
    console.log('AI Analysis Worker stopped');
  }

  async addToQueue(task: AnalysisTask) {
    this.processingQueue.push(task);
    console.log(`Added task to queue for idea ${task.ideaId}, queue length: ${this.processingQueue.length}`);
  }

  private async processQueue() {
    if (!this.isRunning || this.processingQueue.length === 0) {
      return;
    }

    const task = this.processingQueue.shift();
    if (!task) return;

    try {
      await this.processTask(task);
    } catch (error) {
      console.error(`Failed to process task for idea ${task.ideaId}:`, error);
      // 如果失败，可以重新加入队列或标记为失败
      await this.markTaskAsFailed(task.ideaId, error);
    }
  }

  private async processBacklog() {
    if (!this.isRunning) return;

    try {
      // 首先检查数据库表是否有AI分析字段
      const tableInfo = await db.select({
        id: ideas.id,
        content: ideas.content,
        userId: ideas.userId
      })
      .from(ideas)
      .limit(1);

      // 如果查询成功，继续处理积压任务
      const pendingIdeas = await db.select()
        .from(ideas)
        .where(
          and(
            eq(ideas.aiAnalysisStatus, 'pending'),
            lt(ideas.aiAnalysisAttempts, this.maxRetries)
          )
        )
        .limit(10); // 每次最多处理10个

      console.log(`Found ${pendingIdeas.length} pending AI analysis tasks`);

      for (const idea of pendingIdeas) {
        const task: AnalysisTask = {
          ideaId: idea.id,
          content: idea.content,
          userId: idea.userId
        };
        
        await this.addToQueue(task);
      }
    } catch (error: any) {
      // 如果字段不存在，忽略错误
      if (error?.cause?.code === '42703') {
        console.log('AI analysis fields not yet available in database');
      } else {
        console.error('Error processing backlog:', error);
      }
    }
  }

  private async processTask(task: AnalysisTask) {
    console.log(`Processing AI analysis for idea ${task.ideaId}`);

    // 更新状态为处理中
    await db.update(ideas)
      .set({
        aiAnalysisStatus: 'processing',
        aiAnalysisAttempts: sql`${ideas.aiAnalysisAttempts} + 1`,
        lastAnalysisAttempt: new Date()
      })
      .where(eq(ideas.id, task.ideaId));

    try {
      // 获取用户现有的笔记用于AI分析
      const existingIdeas = await db.select()
        .from(ideas)
        .where(
          and(
            eq(ideas.userId, task.userId),
            eq(ideas.aiAnalysisStatus, 'completed')
          )
        )
        .limit(50);

      // 调用DeepSeek API进行分析
      const analysis = await deepSeekService.analyzeIdea(task.content, existingIdeas, task.userId);

      // 更新笔记，包含AI分析结果
      await db.update(ideas)
        .set({
          summary: analysis.title,
          category: analysis.category.toUpperCase() as any,
          title: analysis.title,
          aiAnalysisStatus: 'completed',
          updatedAt: new Date()
        })
        .where(eq(ideas.id, task.ideaId));

      // 处理AI生成的标签
      if (analysis.tags && analysis.tags.length > 0) {
        const tagPromises = analysis.tags.map(async (tagData) => {
          try {
            // 检查标签是否已存在
            const [existingTag] = await db.select()
              .from(tags)
              .where(eq(tags.name, tagData.name))
              .limit(1);

            let tagId;
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // 创建新标签
              const newTagId = uuidv4();
              const [newTag] = await db.insert(tags).values({
                id: newTagId,
                name: tagData.name,
                color: '#3b82f6'
              }).returning();
              tagId = newTag.id;
            }

            // 关联标签到笔记
            await db.insert(ideasTags).values({
              ideaId: task.ideaId,
              tagId: tagId
            });
          } catch (err: any) {
            // 忽略重复标签关联错误
            if (err?.code !== '23505') {
              console.error('Failed to create AI-generated tag:', err);
            }
          }
        });

        await Promise.allSettled(tagPromises);
      }

      // 如果是非todo类别且有相关笔记，自动创建关联
      if (analysis.relatedIdeas && analysis.relatedIdeas.length > 0) {
        const linkPromises = analysis.relatedIdeas.map(async (related) => {
          // 验证相关笔记确实存在且属于该用户
          const [existingIdea] = await db.select()
            .from(ideas)
            .where(eq(ideas.id, related.ideaId))
            .limit(1);
          
          if (existingIdea) {
            try {
              await db.insert(links).values({
                id: uuidv4(),
                fromIdeaId: task.ideaId,
                toIdeaId: related.ideaId,
                reason: related.reason,
                strength: related.strength
              });
            } catch (err: any) {
              // 忽略重复链接错误
              if (err?.code !== '23505') {
                console.error('Failed to create AI-generated link:', err);
              }
            }
          }
        });

        await Promise.allSettled(linkPromises);
      }

      console.log(`Successfully completed AI analysis for idea ${task.ideaId}`);

    } catch (error: any) {
      console.error(`AI analysis failed for idea ${task.ideaId}:`, error.message);
      
      // 检查是否需要重试
      const [currentIdea] = await db.select()
        .from(ideas)
        .where(eq(ideas.id, task.ideaId))
        .limit(1);
      
      if (currentIdea && currentIdea.aiAnalysisAttempts < this.maxRetries) {
        // 重新加入队列进行重试
        console.log(`Re-queuing idea ${task.ideaId} for retry (attempt ${currentIdea.aiAnalysisAttempts + 1})`);
        await db.update(ideas)
          .set({
            aiAnalysisStatus: 'pending',
            updatedAt: new Date()
          })
          .where(eq(ideas.id, task.ideaId));
        
        // 延迟后重新加入队列
        setTimeout(() => {
          this.addToQueue(task);
        }, this.retryDelay);
      } else {
        // 达到最大重试次数，标记为失败
        await this.markTaskAsFailed(task.ideaId, error);
      }
    }
  }

  private async markTaskAsFailed(ideaId: string, error: any) {
    try {
      await db.update(ideas)
        .set({
          aiAnalysisStatus: 'failed',
          updatedAt: new Date()
        })
        .where(eq(ideas.id, ideaId));
      
      console.log(`Marked idea ${ideaId} as failed due to:`, error?.message || error);
    } catch (updateError) {
      console.error(`Failed to mark idea ${ideaId} as failed:`, updateError);
    }
  }

  getQueueLength(): number {
    return this.processingQueue.length;
  }

  isWorkerRunning(): boolean {
    return this.isRunning;
  }
}

// 创建全局实例
export const aiAnalysisWorker = new AIAnalysisWorker();