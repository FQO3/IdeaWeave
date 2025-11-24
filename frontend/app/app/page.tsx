'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Moon, Sun, Menu, Plus, X, Loader2 } from 'lucide-react';
import { useAuthStore, useIdeasStore } from '@/lib/store';
import IdeaList from '@/components/IdeaList';
import LinkCreator from '@/components/LinkCreator';
import { useTheme } from '@/contexts/ThemeContext';
import UserProfileMenu from '@/components/UserProfileMenu';
import EditIdeaModal from '@/components/EditIdeaModal';
import api from '@/lib/api';

export default function Dashboard() {
    const { user, logout, restore } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // 关闭编辑弹窗
    const closeEditModal = () => {
        setEditingIdea(null);
        // 触发刷新
        setRefreshTrigger(prev => prev + 1);
    };

        // 更新笔记内容
    const handleUpdateContent = async (content: string, tags: string[]) => {
        if (!editingIdea) return;
        
        try {
            // 更新内容
            await api.patch(`/ideas/${editingIdea.id}`, { content });
            
            // 更新标签
            await updateTags(editingIdea.id, tags);
            
            closeEditModal();
        } catch (error) {
            console.error('Failed to update idea:', error);
        }
    };

    // 更新标签
    const updateTags = async (ideaId: string, newTags: string[]) => {
        try {
            // 获取当前标签
            const currentTags = editingIdea.tags || [];
            
            // 删除不存在的标签
            for (const currentTag of currentTags) {
                if (!newTags.includes(currentTag.name)) {
                    await api.delete(`/tags/${ideaId}/tags/${currentTag.id}`);
                }
            }
            
            // 添加新标签
            for (const tagName of newTags) {
                const existingTag = currentTags.find((t: any) => t.name === tagName);
                if (!existingTag) {
                    // 创建新标签
                    const tagResponse = await api.post('/tags', { 
                        name: tagName
                    });
                    
                    // 关联标签到笔记
                    await api.post(`/tags/${ideaId}/tags`, { 
                        tagId: tagResponse.data.id 
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update tags:', error);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* 移动端侧边栏遮罩 */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 个人中心侧边栏 */}
            <div className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 z-50 transform transition-all duration-500 ease-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* 侧边栏头部 */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {user.name || '用户'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 侧边栏菜单 */}
                    <div className="flex-1 p-4 space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <span>我的灵感</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                                <Sun className="w-4 h-4 text-white" />
                            </div>
                            <span>设置</span>
                        </button>
                    </div>

                    {/* 侧边栏底部 */}
                    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg flex items-center justify-center">
                                <X className="w-4 h-4 text-white" />
                            </div>
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 主内容区域 */}
            <div>
                {/* 顶部导航 */}
                <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {/* 菜单按钮 */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all duration-300"
                                aria-label="打开菜单"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 hover:opacity-80 transition-all duration-300"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Lightbulb className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">灵织 IdeaWeave</h1>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* 桌面端用户信息 */}
                            <div className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all duration-300"
                                    aria-label="切换主题"
                                >
                                    {theme === 'light' ? (
                                        <Moon className="w-4 h-4" />
                                    ) : (
                                        <Sun className="w-4 h-4" />
                                    )}
                                </button>
                                
                                {/* 组件化的用户信息栏 */}
                                <UserProfileMenu onLogout={handleLogout} />
                            </div>
                            
                            {/* 移动端主题切换 */}
                            <button
                                onClick={toggleTheme}
                                className="md:hidden flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all duration-300"
                                aria-label="切换主题"
                            >
                                {theme === 'light' ? (
                                    <Moon className="w-4 h-4" />
                                ) : (
                                    <Sun className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* 主内容 */}
                <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl">
                        {/* 炫酷的中心输入区域 */}
                        <div className="flex flex-col items-center justify-center mb-12">
                            {!inputMode ? (
                                // 圆形加号按钮
                                <button
                                    onClick={handleAddIdea}
                                    className="group relative w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 hover:rotate-12"
                                >
                                    {/* 发光效果 */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                                    
                                    {/* 内部圆环 */}
                                    <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"></div>
                                    
                                    {/* 加号图标 */}
                                    <div className="relative z-10 flex items-center justify-center h-full">
                                        <Plus className="w-12 h-12 text-white transform group-hover:rotate-90 transition-transform duration-500" />
                                    </div>
                                    
                                    {/* 悬浮文字 */}
                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            记录新灵感
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                // 现代化输入框
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
                                        <div className="relative">
                                            <textarea
                                                value={ideaContent}
                                                onChange={(e) => setIdeaContent(e.target.value)}
                                                placeholder="这一刻，你在想什么？"
                                                className="w-full min-h-[200px] p-6 text-lg bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200/50 dark:border-gray-600/50 rounded-xl resize-none focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
                                                autoFocus
                                            />
                                            
                                            {/* 输入框装饰线 */}
                                            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 group-hover:w-full"></div>
                                        </div>
                                        
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
                        </div>

            {/* 编辑笔记弹窗 - 在app级别 */}
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
        </div>
    );
}