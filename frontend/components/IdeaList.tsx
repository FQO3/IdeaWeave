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
            <div className="text-center py-12 text-gray-500">
                还没有灵感记录，快来添加第一条吧！
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {ideas.map((idea) => (
                <div
                    key={idea.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <p className="text-gray-800 whitespace-pre-wrap">{idea.content}</p>

                            {idea.summary && (
                                <p className="mt-2 text-sm text-gray-600 italic">
                                    摘要：{idea.summary}
                                </p>
                            )}

                            {idea.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
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

                            <p className="mt-2 text-xs text-gray-400">
                                {new Date(idea.createdAt).toLocaleString('zh-CN')}
                            </p>
                        </div>

                        <button
                            onClick={() => handleDelete(idea.id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
