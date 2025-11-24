'use client';

import { useEffect, useState } from 'react';
import { Trash2, Tag, Loader2, Edit2, MoreVertical } from 'lucide-react';
import api from '@/lib/api';
import { useIdeasStore } from '@/lib/store';

interface IdeaListProps {
    onEditIdea: (idea: any) => void;
    refreshTrigger?: number;
}

export default function IdeaList({ onEditIdea, refreshTrigger }: IdeaListProps) {
    const { ideas, setIdeas, removeIdea } = useIdeasStore();
    const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
    }, [refreshTrigger]);

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

    // 更新标题
    const handleUpdateTitle = async (ideaId: string, newTitle: string) => {
        try {
            await api.patch(`/ideas/${ideaId}`, {
                title: newTitle,
                summary: newTitle
            });
            loadIdeas(); // 重新加载数据
        } catch (error) {
            console.error('Failed to update title:', error);
        }
    };

    // 更新分类
    const handleUpdateCategory = async (ideaId: string, newCategory: string) => {
        try {
            await api.patch(`/ideas/${ideaId}`, {
                category: newCategory
            });
            loadIdeas(); // 重新加载数据
        } catch (error) {
            console.error('Failed to update category:', error);
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
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow cursor-pointer"
                    onDoubleClick={() => onEditIdea(idea)}
                >
                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                        <div className="flex-1">
                            {/* 可编辑的标题和分类标签 */}
                            {(idea.title || idea.category) && (
                                <div className="mb-3 space-y-2 animate-in fade-in-50 slide-in-from-top-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* 标题标签 - 可编辑 */}
                                        {idea.title && (
                                            editingTitle === idea.id ? (
                                                <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500">
                                                    <input
                                                        defaultValue={idea.title}
                                                        onBlur={(e) => {
                                                            handleUpdateTitle(idea.id, e.target.value);
                                                            setEditingTitle(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateTitle(idea.id, e.currentTarget.value);
                                                                setEditingTitle(null);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingTitle(null);
                                                            }
                                                        }}
                                                        className="bg-transparent outline-none min-w-[60px] max-w-[120px] text-blue-800 dark:text-blue-200"
                                                        maxLength={20}
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 overflow-hidden group"
                                                    onClick={() => setEditingTitle(idea.id)}
                                                >
                                                    {idea.title}
                                                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
                                                </span>
                                            )
                                        )}

                                        {/* 分类标签 - 可编辑但限制为三个选项 */}
                                        {idea.category && (
                                            editingCategory === idea.id ? (
                                                <select
                                                    defaultValue={idea.category}
                                                    onChange={(e) => {
                                                        handleUpdateCategory(idea.id, e.target.value);
                                                        setEditingCategory(null);
                                                    }}
                                                    onBlur={() => setEditingCategory(null)}
                                                    className="text-xs font-medium px-2 py-1 rounded-full border-2 border-blue-500 outline-none cursor-pointer"
                                                    style={{
                                                        backgroundColor: idea.category === 'TODO'
                                                            ? 'rgb(254 226 226)'
                                                            : idea.category === 'PLAN'
                                                                ? 'rgb(220 252 231)'
                                                                : 'rgb(243 232 255)',
                                                        color: idea.category === 'TODO'
                                                            ? 'rgb(153 27 27)'
                                                            : idea.category === 'PLAN'
                                                                ? 'rgb(21 128 61)'
                                                                : 'rgb(126 34 206)'
                                                    }}
                                                >
                                                    <option value="TODO" style={{ backgroundColor: 'rgb(254 226 226)', color: 'rgb(153 27 27)' }}>待办</option>
                                                    <option value="PLAN" style={{ backgroundColor: 'rgb(220 252 231)', color: 'rgb(21 128 61)' }}>规划</option>
                                                    <option value="INSPIRATION" style={{ backgroundColor: 'rgb(243 232 255)', color: 'rgb(126 34 206)' }}>灵感</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`text-xs font-medium px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${idea.category === 'TODO'
                                                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                            : idea.category === 'PLAN'
                                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                                        }`}
                                                    onClick={() => setEditingCategory(idea.id)}
                                                >
                                                    {idea.category === 'TODO' ? '待办' :
                                                        idea.category === 'PLAN' ? '规划' : '灵感'}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{idea.content}</p>

                            {/* 显示标签 */}
                            <div className="mt-2 sm:mt-3">
                                {idea.tags && idea.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {idea.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-blue-100"
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

                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => setMenuOpenId(menuOpenId === idea.id ? null : idea.id)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>

                            {menuOpenId === idea.id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 animate-in fade-in-0 zoom-in-95">
                                    <button
                                        onClick={() => {
                                            onEditIdea(idea);
                                            setMenuOpenId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete(idea.id);
                                            setMenuOpenId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        删除
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}