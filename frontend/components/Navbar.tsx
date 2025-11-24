"use client";

import { useRouter } from "next/navigation";
import { Lightbulb, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import UserProfileMenu from "./UserProfileMenu";

interface NavbarProps {
    onMenuClick: () => void;
    onLogout: () => void;
}

export default function Navbar({ onMenuClick, onLogout }: NavbarProps) {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="px-6 py-4 flex justify-between items-center">
                {/* 左侧 */}
                <div className="flex items-center gap-4">
                    {/* 菜单按钮 */}
                    <button
                        onClick={onMenuClick}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all duration-300"
                        aria-label="打开菜单"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 hover:opacity-80 transition-all duration-300"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            灵织 IdeaWeave
                        </h1>
                    </button>
                </div>

                {/* 右侧 */}
                <div className="flex items-center gap-4">
                    {/* 桌面端 */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* 主题切换 */}
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

                        {/* 用户菜单 */}
                        <UserProfileMenu onLogout={onLogout} />
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
    );
}