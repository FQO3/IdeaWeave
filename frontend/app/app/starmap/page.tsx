'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// 这是一个占位页面，实际实现需要更复杂的星图可视化
export default function StarMapPage() {
  const { user, restore } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await restore();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) router.push('/auth');
    })();
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* 导航栏 */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold text-white">
            🌟 笔记星图
          </h1>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
            <div className="text-white/80 mb-6">
              <h2 className="text-3xl font-bold mb-4">🚧 星图页面开发中</h2>
              <p className="text-lg">
                这里将展示所有笔记的完整星图可视化，包括笔记间的关联关系和标签分布。
              </p>
              <p className="text-sm mt-4 text-white/60">
                功能包括：拖拽节点、缩放视图、搜索笔记、查看关联详情等
              </p>
            </div>
            
            {/* 简单的占位星图 */}
            <div className="relative h-96 bg-black/20 rounded-xl border border-white/10 flex items-center justify-center">
              <div className="text-white/40 text-sm">
                完整的交互式星图将在这里显示
              </div>
              
              {/* 模拟节点 */}
              <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              
              {/* 模拟连线 */}
              <div className="absolute top-1/4 left-1/4 w-1/4 h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform rotate-45 opacity-50"></div>
              <div className="absolute top-1/3 right-1/4 w-1/4 h-1 bg-gradient-to-r from-purple-400 to-green-400 transform -rotate-45 opacity-50"></div>
            </div>
            
            <button
              onClick={() => router.push('/app')}
              className="mt-8 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              返回主页面
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}