'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

export default function LoginForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

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
            router.push('/dashboard');
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <div>
                    <h2 className="text-3xl font-bold text-center">
                        {isLogin ? '登录' : '注册'} 灵织
                    </h2>
                    <p className="mt-2 text-center text-gray-600">
                        {isLogin ? '欢迎回来' : '开始记录你的灵感'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                姓名
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            邮箱
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            密码
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                        {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                    </button>
                </div>
            </div>
        </div>
    );
}
