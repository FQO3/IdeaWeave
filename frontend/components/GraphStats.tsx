"use client";

import { useState } from "react";

interface GraphStatsProps {
    nodeCount: number;
    linkCount: number;
    tagCount: number;
}

export default function GraphStats({ nodeCount, linkCount, tagCount }: GraphStatsProps) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="fixed right-4 bottom-4 z-30">
            {collapsed ? (
                <button
                    onClick={() => setCollapsed(false)}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                    <span className="text-sm text-gray-700 dark:text-gray-200">📊</span>
                </button>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 min-w-[180px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">统计</h3>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <div className="flex justify-between">
                            <span>灵感节点：</span>
                            <span className="font-semibold">{nodeCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>连接数：</span>
                            <span className="font-semibold">{linkCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>标签数：</span>
                            <span className="font-semibold">{tagCount}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
