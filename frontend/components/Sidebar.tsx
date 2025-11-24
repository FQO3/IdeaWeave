"use client";

import { useRouter } from "next/navigation";
import { Lightbulb, Sun, Settings, X, LogOut } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name?: string;
        email: string;
    };
    onLogout: () => void;
}

export default function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
    const router = useRouter();

    const getUserInitial = () => {
        if (user.name) return user.name.charAt(0).toUpperCase();
        if (user.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    return (
        <>
            {/* 遮罩 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* 侧边栏 */}
            <div
                className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 z-50 transform transition-all duration-500 ease-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* 头部 - 用户信息 */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg">
                                {getUserInitial()}
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

                    {/* 菜单 */}
                    <div className="flex-1 p-4 space-y-2">
                        <button
                            onClick={() => {
                                router.push('/app');
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <span>我的灵感</span>
                        </button>

                        <button
                            onClick={() => {
                                router.push('/app/starmap');
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                                <Sun className="w-4 h-4 text-white" />
                            </div>
                            <span>灵感星图</span>
                        </button>

                        <button
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                                <Settings className="w-4 h-4 text-white" />
                            </div>
                            <span>设置</span>
                        </button>
                    </div>

                    {/* 底部 - 退出登录 */}
                    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg flex items-center justify-center">
                                <LogOut className="w-4 h-4 text-white" />
                            </div>
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}