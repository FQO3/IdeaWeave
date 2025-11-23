'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import api from '@/lib/api';
import { useIdeasStore } from '@/lib/store';

export default function IdeaInput() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const addIdea = useIdeasStore((state) => state.addIdea);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const { data } = await api.post('/ideas', { content, type: 'TEXT' });
            addIdea(data);
            setContent('');
        } catch (error) {
            console.error('Failed to create idea:', error);
            alert('创建失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="记录你的灵感..."
                    className="flex-1 min-h-[100px] p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
            </div>

            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="submit"
                    disabled={!content.trim() || loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            保存灵感
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
