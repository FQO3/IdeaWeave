'use client';

import { useEffect } from 'react';
import { Trash2, Tag } from 'lucide-react';
import api from '@/lib/api';
import { useIdeasStore } from '@/lib/store';

export default function IdeaList() {
    const { ideas, setIdeas, removeIdea } = useIdeasStore();

    const loadIdeas = async () => {
        try {
            const { data } = await api.get('/ideas');
            setIdeas(data);
        } catch (error) {
            console.error('Failed to load ideas:', error);
        }
    };

    useEffect(() => {
        loadIdeas();
    }, []);


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
                            {/* AI分析结果 */}
                            {idea.aiAnalysis && (
                                <div className="mb-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                            {idea.aiAnalysis.title}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            idea.aiAnalysis.category === 'todo' 
                                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                : idea.aiAnalysis.category === 'plan'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                        }`}>
                                            {idea.aiAnalysis.category === 'todo' ? '待办' : 
                                             idea.aiAnalysis.category === 'plan' ? '规划' : '灵感'}
                                        </span>
                                    </div>
                                    
                                    {/* 相关笔记 */}
                                    {idea.aiAnalysis.relatedIdeas && idea.aiAnalysis.relatedIdeas.length > 0 && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">相关笔记：</span>
                                            {idea.aiAnalysis.relatedIdeas.map((related, index) => (
                                                <div key={index} className="ml-2 mt-1">
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {related.ideaId.slice(0, 8)}...
                                                    </span>
                                                    <span className="ml-1">({related.reason})</span>
                                                    <span className="ml-1 text-gray-500">
                                                        强度: {(related.strength * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{idea.content}</p>

                            {idea.summary && (
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                                    摘要：{idea.summary}
                                </p>
                            )}

                            {idea.tags.length > 0 && (
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                                    {idea.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
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
                            )}

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
