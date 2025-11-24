"use client";

import { useState } from "react";

export default function GraphLegend() {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="fixed left-4 bottom-4 z-30">
            {collapsed ? (
                <button
                    onClick={() => setCollapsed(false)}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                    <span className="text-sm text-gray-700 dark:text-gray-200">图例</span>
                </button>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">图例</h3>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-200">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>文本灵感</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>其他类型</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>搜索结果</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <p className="text-gray-500 dark:text-gray-400">拖动节点调整位置</p>
                            <p className="text-gray-500 dark:text-gray-400">滚轮缩放视图</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
