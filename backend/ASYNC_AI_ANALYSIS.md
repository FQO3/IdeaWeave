# 异步AI分析系统

## 概述

本系统将AI分析从同步处理改为异步处理，解决了用户需要等待AI分析完成才能创建灵感的问题。

## 主要改进

### 1. 异步处理流程
- **立即响应**: 用户创建灵感时立即返回响应
- **后台分析**: AI分析在后台队列中异步进行
- **状态跟踪**: 每个灵感都有AI分析状态字段
- **自动重试**: 分析失败时自动重试（最多3次）

### 2. 数据库结构变更

在`ideas`表中添加了以下字段：
- `ai_analysis_status`: AI分析状态 (`pending`, `processing`, `completed`, `failed`)
- `ai_analysis_attempts`: 分析尝试次数
- `last_analysis_attempt`: 最后分析尝试时间

### 3. API端点变更

#### 创建灵感 (POST /api/ideas)
- **立即返回**: 不等待AI分析完成
- **返回状态**: 包含`aiAnalysis.status`字段表示分析状态

#### 获取AI分析状态 (GET /api/ideas/:id/ai-status)
- **查询状态**: 获取特定灵感的AI分析状态
- **返回信息**: 状态、尝试次数、最后尝试时间、分析结果

#### 手动触发分析 (POST /api/ideas/:id/analyze)
- **重新分析**: 手动重新触发AI分析
- **重置状态**: 将状态重置为pending并重新加入队列

### 4. 后台工作器

AI分析工作器自动运行，处理以下任务：
- **队列处理**: 每10秒处理一次队列中的任务
- **积压处理**: 每分钟检查一次未完成的AI分析任务
- **错误处理**: 自动重试失败的分析
- **状态更新**: 实时更新数据库中的分析状态

## 使用示例

### 创建灵感
```javascript
// 请求
POST /api/ideas
{
  "content": "学习React Hooks的最佳实践"
}

// 响应（立即返回）
{
  "id": "uuid",
  "content": "学习React Hooks的最佳实践",
  "aiAnalysis": {
    "status": "pending",
    "message": "AI分析正在后台进行，稍后刷新查看结果"
  }
}
```

### 检查分析状态
```javascript
// 请求
GET /api/ideas/uuid/ai-status

// 响应
{
  "status": "completed",
  "attempts": 1,
  "lastAttempt": "2024-01-01T10:00:00Z",
  "hasAnalysis": true,
  "analysis": {
    "title": "React Hooks学习",
    "category": "PLAN"
  }
}
```

### 手动重新分析
```javascript
// 请求
POST /api/ideas/uuid/analyze

// 响应
{
  "success": true,
  "message": "AI分析已重新加入队列"
}
```

## 配置说明

### 环境变量
确保设置了正确的DeepSeek API密钥：
```bash
DEEPSEEK_API_KEY=your_api_key_here
```

### 工作器配置
- `maxRetries`: 最大重试次数（默认3次）
- `retryDelay`: 重试延迟（默认5秒）
- 队列处理间隔：10秒
- 积压处理间隔：60秒

## 故障排除

### 常见问题

1. **AI分析一直处于pending状态**
   - 检查DeepSeek API密钥是否正确配置
   - 检查网络连接
   - 查看服务器日志了解详细错误

2. **分析失败**
   - 系统会自动重试最多3次
   - 可以手动触发重新分析
   - 检查API调用配额和限制

3. **工作器未启动**
   - 检查服务器启动日志
   - 确认工作器在应用启动时被调用

### 日志监控
工作器会在控制台输出以下信息：
- 任务加入队列
- 分析开始和完成
- 错误和重试信息
- 队列长度统计

## 性能优势

- **用户体验**: 创建灵感无需等待AI分析
- **系统稳定性**: AI API故障不影响核心功能
- **可扩展性**: 易于添加更多AI分析任务
- **容错性**: 自动重试和错误处理机制