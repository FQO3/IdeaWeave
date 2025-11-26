'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { useAuthStore, useIdeasStore } from '@/lib/store';
import IdeaList from '@/components/IdeaList';
import LinkCreator from '@/components/LinkCreator';
import EditIdeaModal from '@/components/EditIdeaModal';
import MainLayout from '@/components/MainLayout';
import api from '@/lib/api';

export default function Dashboard() {
    const { user, logout, restore } = useAuthStore();
    const router = useRouter();
    const [inputMode, setInputMode] = useState(false);
    const [ideaContent, setIdeaContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingIdea, setEditingIdea] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const addIdea = useIdeasStore((state) => state.addIdea);

    useEffect(() => {
        (async () => {
            await restore();
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) router.push('/auth');
        })();
    }, [router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleAddIdea = () => {
        setInputMode(true);
    };

    const handleCancelInput = () => {
        setInputMode(false);
        setIdeaContent('');
    };

    const handleSubmitIdea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ideaContent.trim()) return;

        setLoading(true);
        try {
            const { data } = await api.post('/ideas', { content: ideaContent, type: 'TEXT' });
            addIdea(data);
            setIdeaContent('');
            setInputMode(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('创建失败:', error);
            alert('创建失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const closeEditModal = () => {
        setEditingIdea(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleUpdateContent = async (content: string, tags: string[]) => {
        if (!editingIdea) return;

        try {
            await api.patch(`/ideas/${editingIdea.id}`, { content });
            await updateTags(editingIdea.id, tags);
            closeEditModal();
        } catch (error) {
            console.error('Failed to update idea:', error);
        }
    };

    const updateTags = async (ideaId: string, newTags: string[]) => {
        try {
            const currentTags = editingIdea.tags || [];

            for (const currentTag of currentTags) {
                if (!newTags.includes(currentTag.name)) {
                    await api.delete(`/tags/${ideaId}/tags/${currentTag.id}`);
                }
            }

            for (const tagName of newTags) {
                const existingTag = currentTags.find((t: any) => t.name === tagName);
                if (!existingTag) {
                    const tagResponse = await api.post('/tags', { name: tagName });
                    await api.post(`/tags/${ideaId}/tags`, { tagId: tagResponse.data.id });
                }
            }
        } catch (error) {
            console.error('Failed to update tags:', error);
        }
    };

    if (!user) return null;

    return (
        <MainLayout user={user} onLogout={handleLogout}>
            <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
                <div className="w-full max-w-4xl">
                    {/* 中心输入区域 */}
                    <div className="flex flex-col items-center justify-center mb-12">
                        {!inputMode ? (
                            <button
                                onClick={handleAddIdea}
                                className="group relative w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 hover:rotate-12"
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"></div>
                                <div className="relative z-10 flex items-center justify-center h-full">
                                    <Plus className="w-12 h-12 text-white transform group-hover:rotate-90 transition-transform duration-500" />
                                </div>
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        记录新灵感
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div className="w-full max-w-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 animate-in fade-in-0 zoom-in-95 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        记录灵感
                                    </h2>
                                    <button
                                        onClick={handleCancelInput}
                                        className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitIdea} className="space-y-6">
                                    <textarea
                                        value={ideaContent}
                                        onChange={(e) => setIdeaContent(e.target.value)}
                                        placeholder="这一刻，你在想什么？"
                                        className="w-full min-h-[200px] p-6 text-lg bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200/50 dark:border-gray-600/50 rounded-xl resize-none focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                                        autoFocus
                                    />

                                    <div className="flex justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={handleCancelInput}
                                            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!ideaContent.trim() || loading}
                                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    保存中...
                                                </>
                                            ) : (
                                                '保存灵感'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* 灵感列表 */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                💡 我的灵感库
                            </h2>
                            <IdeaList onEditIdea={setEditingIdea} refreshTrigger={refreshTrigger} />
                            <div className="mt-8">
                                <LinkCreator />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 编辑弹窗 */}
            {editingIdea && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">编辑笔记</h2>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-auto">
                            <EditIdeaModal
                                idea={editingIdea}
                                onSave={handleUpdateContent}
                                onCancel={closeEditModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}