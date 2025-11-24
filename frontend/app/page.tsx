'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Sparkles, Users, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
  const { user, restore } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // 检查用户登录状态
    restore();
  }, [restore]);

  const handleGetStarted = () => {
    // 如果用户已登录，直接跳转到应用页面
    if (user) {
      router.push('/app');
    } else {
      // 如果未登录，跳转到认证页面
      router.push('/auth');
    }
  };

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* 导航栏 */}
            <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">灵织 IdeaWeave</h1>
                    </button>
                    <button
                        onClick={handleGetStarted}
                        className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                        开始使用
                    </button>
                </div>
            </nav>

            {/* 英雄区域 */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 sm:mb-8">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                            让灵感不再流失
                        </span>
                    </div>
                    
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                        记录、连接、
                        <span className="text-blue-600 dark:text-blue-400"> 创造</span>
                    </h1>
                    
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                        灵织是一个智能灵感管理平台，帮助你将零散的灵感编织成完整的创意网络，
                        让每一个想法都有机会成长。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
                        <button
                            onClick={handleGetStarted}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base sm:text-lg font-semibold transition-colors"
                        >
                            ✨ 收集你的灵感
                        </button>
                        <button className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-base sm:text-lg font-semibold transition-colors">
                            了解更多
                        </button>
                    </div>
                </div>

                {/* 特性展示 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-20">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            快速记录
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            随时随地记录你的灵感，支持多种格式，让创意不再错过。
                        </p>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            智能关联
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            自动发现灵感之间的联系，构建你的创意网络。
                        </p>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            团队协作
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            与团队成员分享灵感，共同完善创意想法。
                        </p>
                    </div>
                </div>
            </div>

            {/* 页脚 */}
            <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-12 sm:mt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        © 2024 灵织 IdeaWeave. 让每一个灵感都有价值。
                    </p>
                </div>
            </footer>
        </div>
  );
}
