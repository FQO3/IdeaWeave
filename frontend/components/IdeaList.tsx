'use client';

import { useEffect, useState } from 'react';
import { Trash2, Tag, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useIdeasStore } from '@/lib/store';

export default function IdeaList() {
    const { ideas, setIdeas, removeIdea } = useIdeasStore();
    const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

    const loadIdeas = async () => {
        try {
            const { data } = await api.get('/ideas');
            setIdeas(data);
        } catch (error) {
            console.error('Failed to load ideas:', error);
        }
    };

    // 检查AI分析状态
    const checkAIStatus = async (ideaId: string) => {
        try {
            const { data } = await api.get(`/ideas/${ideaId}/ai-status`);
            
            if (data.status === 'completed' || data.status === 'failed') {
                // 分析完成，停止轮询并重新加载数据
                setPollingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(ideaId);
                    return newSet;
                });
                loadIdeas(); // 重新加载数据以获取标签
            }
        } catch (error) {
            console.error('Failed to check AI status:', error);
        }
    };

    useEffect(() => {
        loadIdeas();
    }, []);

    // 设置轮询
    useEffect(() => {
        // 找出需要轮询的笔记
        const pendingIdeas = ideas.filter(idea => 
            idea.aiAnalysisStatus === 'pending' || 
            idea.aiAnalysisStatus === 'processing'
        );
        
        if (pendingIdeas.length > 0) {
            setPollingIds(new Set(pendingIdeas.map(idea => idea.id)));
        }
    }, [ideas]);

    // 轮询逻辑
    useEffect(() => {
        if (pollingIds.size === 0) return;

        const interval = setInterval(() => {
            pollingIds.forEach(ideaId => {
                checkAIStatus(ideaId);
            });
        }, 5000); // 每5秒检查一次

        return () => clearInterval(interval);
    }, [pollingIds]);


    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条灵感吗？')) return;

        try {
            await api.delete(`/ideas/${id}`);
            removeIdea(id);
        } catch (error) {
            console.error('Failed to delete idea:', error);
            alert('删除失败');
        }
    };

    if (ideas.length === 0) {
                return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                还没有灵感记录，快来添加第一条吧！
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {ideas.map((idea) => (
                                                                <div
                    key={idea.id}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow"
                >
                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                        <div className="flex-1">
                                                        {/* AI分析结果 - 只在分析完成时显示 */}
                            {idea.aiAnalysisStatus === 'completed' && idea.summary && idea.title && (
                                <div className="mb-3 space-y-2 animate-in fade-in-50 slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                            {idea.title}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            idea.category === 'TODO' 
                                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                : idea.category === 'PLAN'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                        }`}>
                                            {idea.category === 'TODO' ? '待办' : 
                                             idea.category === 'PLAN' ? '规划' : '灵感'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{idea.content}</p>

                            {idea.summary && (
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                                    摘要：{idea.summary}
                                </p>
                            )}

                                                        {/* 标签区域 */}
                            <div className="mt-2 sm:mt-3">
                                {idea.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {idea.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-2"
                                                style={{
                                                    backgroundColor: tag.color + '20',
                                                    color: tag.color
                                                }}
                                            >
                                                <Tag className="w-3 h-3" />
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    // AI分析中动画
                                    (idea.aiAnalysisStatus === 'pending' || idea.aiAnalysisStatus === 'processing') && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>AI正在分析中，即将生成标签...</span>
                                        </div>
                                    )
                                )}
                            </div>

                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                {new Date(idea.createdAt).toLocaleString('zh-CN')}
                            </p>
                        </div>

                        <button
                            onClick={() => handleDelete(idea.id)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
