'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Lightbulb, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import IdeaInput from '@/components/IdeaInput';
import IdeaList from '@/components/IdeaList';
import LinkCreator from '@/components/LinkCreator';
import { useTheme } from '@/contexts/ThemeContext';

export default function Dashboard() {
    const { user, logout, restore } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        (async () => {
            await restore(); // 从 store 取 restore
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) router.push('/');
        })();
    }, [router]);


    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!user) return null;

    return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 顶部导航 */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">灵织 IdeaWeave</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            aria-label="切换主题"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-4 h-4" />
                            ) : (
                                <Sun className="w-4 h-4" />
                            )}
                        </button>
                        <span className="text-gray-600 dark:text-gray-300">你好，{user.name || user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                            <LogOut className="w-4 h-4" />
                            退出
                        </button>
                    </div>
                </div>
            </nav>

            {/* 主内容 */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* 输入区域 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/50">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">✨ 记录新灵感</h2>
                        <IdeaInput />
                    </div>

                    {/* 灵感列表 */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">💡 我的灵感库</h2>
                        <IdeaList />
                        <LinkCreator />
                    </div>
                </div>
            </main>
        </div>
    );
}
