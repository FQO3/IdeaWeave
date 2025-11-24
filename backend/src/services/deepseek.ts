import axios from 'axios';

interface DeepSeekAnalysis {
  title: string;
  category: 'todo' | 'plan' | 'inspiration';
  tags?: Array<{
    name: string;
    color: string;
  }>;
  relatedIdeas?: Array<{
    ideaId: string;
    reason: string;
    strength: number;
  }>;
}

interface Idea {
  id: string;
  content: string;
  summary?: string | null;
  type: string;
  category?: string;
  title?: string | null;
  createdAt: Date | string;
}

export class DeepSeekService {
  private apiKey: string;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('DEEPSEEK_API_KEY not found in environment variables');
    }
  }

  async analyzeIdea(
    newIdeaContent: string,
    existingIdeas: Idea[],
    userId: string
  ): Promise<DeepSeekAnalysis> {
    if (!this.apiKey) {
      // 如果没有配置API密钥，返回默认分析
      console.warn('DeepSeek API key not configured, using default analysis');
      return this.getDefaultAnalysis(newIdeaContent);
    }

    try {
      const prompt = this.buildAnalysisPrompt(newIdeaContent, existingIdeas);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的笔记分析助手。请严格按照要求分析用户笔记。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      const analysisText = response.data.choices[0].message.content;
      return this.parseAnalysisResponse(analysisText);
    } catch (error: any) {
      console.error('DeepSeek API error:', error.message);
      
      // 如果是认证错误，记录更详细的信息
      if (error.response?.status === 401) {
        console.error('DeepSeek API authentication failed. Please check your API key.');
      }
      
      // 抛出错误让调用方处理
      throw new Error(`DeepSeek API调用失败: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(newIdeaContent: string, existingIdeas: Idea[]): string {
    console.log('Building analysis prompt for new idea content:', newIdeaContent);
    console.log('Building analysis prompt with existing ideas:', existingIdeas);
    const existingIdeasText = existingIdeas
      .map(idea => `ID: ${idea.id}\n内容: ${idea.content}\n摘要: ${idea.summary || '无'}\n类型: ${idea.type}\n---`)
      .join('\n');

    return `请分析以下新笔记，并严格按照要求返回JSON格式的分析结果。

新笔记内容：
"""
${newIdeaContent}
"""

用户现有的笔记列表：
${existingIdeasText}

分析要求：
1. 生成一个不超过10个字的标题
2. 分类（严格三选一）：
   - todo: 具体的待办事项、任务
   - plan: 新的规划、项目想法
   - inspiration: 规划下的灵感、想法
3. 标签生成（生成2-4个相关标签）：
   - 每个标签应该是简短的关键词
   - 为每个标签推荐一个合适的颜色（十六进制颜色码）
4. 关联分析（仅当分类不是todo时需要）：
   - 找出与新笔记最相关的现有笔记（最多3个）
   - 说明关联原因
   - 给出关联强度（0.1-1.0）

注意：所有关联分析必须严格限制在提供的现有笔记列表中！

请返回JSON格式：
{
  "title": "标题",
  "category": "todo|plan|inspiration",
  "tags": [
    {
      "name": "标签名",
      "color": "#颜色码"
    }
  ],
  "relatedIdeas": [
    {
      "ideaId": "笔记ID",
      "reason": "关联原因",
      "strength": 0.8
    }
  ]
}`;
  }

  private parseAnalysisResponse(responseText: string): DeepSeekAnalysis {
    console.log('Parsing DeepSeek response:', responseText);
    try {
      // 尝试从响应文本中提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 验证分类
        if (!['todo', 'plan', 'inspiration'].includes(parsed.category)) {
          throw new Error('Invalid category');
        }

        // 如果是todo类别，确保没有关联
        if (parsed.category === 'todo' && parsed.relatedIdeas) {
          parsed.relatedIdeas = [];
        }

        return parsed;
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse DeepSeek response:', error);
      return this.getDefaultAnalysis('');
    }
  }

  private getDefaultAnalysis(content: string): DeepSeekAnalysis {
    // 简单的启发式分类
    console.log('Warn!! Using default analysis for content:', content);
    const lowerContent = content.toLowerCase();
    let category: 'todo' | 'plan' | 'inspiration' = 'inspiration';
    
    if (lowerContent.includes('todo') || lowerContent.includes('待办') || 
        lowerContent.includes('任务') || lowerContent.includes('需要') ||
        lowerContent.includes('应该') || lowerContent.includes('必须')) {
      category = 'todo';
    } else if (lowerContent.includes('计划') || lowerContent.includes('规划') ||
               lowerContent.includes('项目') || lowerContent.includes('目标')) {
      category = 'plan';
    }

    // 生成简单标题
    const title = content.slice(0, 10).trim() || '新笔记';

    // 生成简单标签
    const defaultTags = [
      { name: '笔记', color: '#3b82f6' },
      { name: '灵感', color: '#8b5cf6' }
    ];

    return {
      title,
      category,
      tags: defaultTags,
      relatedIdeas: category === 'todo' ? [] : undefined
    };
  }
}

export const deepSeekService = new DeepSeekService();