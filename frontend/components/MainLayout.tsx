"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
    user: {
        name?: string;
        email: string;
    };
    onLogout: () => void;
    className?: string;  // ✅ 允许自定义背景样式
}

export default function MainLayout({ children, user, onLogout, className }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={className || "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"}>
            {/* 侧边栏 */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                onLogout={onLogout}
            />

            {/* 主内容 */}
            <div>
                {/* 导航栏 */}
                <Navbar
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onLogout={onLogout}
                />

                {/* 页面内容 */}
                {children}
            </div>
        </div>
    );
}