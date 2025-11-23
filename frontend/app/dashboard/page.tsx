'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import IdeaInput from '@/components/IdeaInput';
import IdeaList from '@/components/IdeaList';
import LinkCreator from '@/components/LinkCreator';

export default function Dashboard() {
    const { user, logout, restore } = useAuthStore();
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
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold">灵织 IdeaWeave</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">你好，{user.name || user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
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
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">✨ 记录新灵感</h2>
                        <IdeaInput />
                    </div>

                    {/* 灵感列表 */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">💡 我的灵感库</h2>
                        <IdeaList />
                        <LinkCreator />
                    </div>
                </div>
            </main>
        </div>
    );
}
