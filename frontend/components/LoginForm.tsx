'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, setAuth, restore } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        // 检查用户是否已登录
        restore();
    }, [restore]);

    useEffect(() => {
        // 如果用户已登录，自动跳转到应用页面
        if (user) {
            router.push('/app');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email, password }
                : { email, password, name };
                

            const { data } = await api.post(endpoint, payload);

            setAuth(data.user, data.token);
            router.push('/app');
        } catch (err: unknown) {
            let message = 'Something went wrong';

            if (err && typeof err === 'object' && 'response' in err) {
                const anyErr = err as {
                    response?: { data?: { error?: string } };
                };
                message = anyErr.response?.data?.error ?? message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                        {/* 导航栏 */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">灵织 IdeaWeave</h1>
                    </button>
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
                    </div>
                </div>
            </nav>

            {/* 登录表单 */}
            <div className="flex items-center justify-center py-8 sm:py-16">
                <div className="w-full max-w-md mx-4 sm:mx-auto space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50">
                                        <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
                            {isLogin ? '登录' : '注册'} 灵织
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-center text-gray-600 dark:text-gray-400">
                            {isLogin ? '欢迎回来' : '开始记录你的灵感'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {!isLogin && (
                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    用户名
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="请输入用户名"
                                />
                            </div>
                        )}

                        <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                邮箱
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder="请输入邮箱"
                            />
                        </div>

                        <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                密码
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                placeholder="请输入密码"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
                        )}

                                                <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 transition-colors"
                        >
                            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
