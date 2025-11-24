"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useIdeasStore } from "../../../lib/store";
import type { GraphNode } from "../../../lib/store";
import api from "../../../lib/api";
import ForceGraph from "../../../components/ForceGraph";
import GraphLegend from "../../../components/GraphLegend";
import GraphStats from "../../../components/GraphStats";
import NodeDetailCard from "../../../components/NodeDetailCard";
import MainLayout from "../../../components/MainLayout";

export default function StarmapPage() {
    const router = useRouter();
    const { graphData, setGraphData } = useIdeasStore();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNode, setSelectedNode] = useState<{
        node: GraphNode;
        position: { x: number; y: number }
    } | null>(null);
    const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

    // ✅ 认证检查 + 获取用户信息
    useEffect(() => {
        const init = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                router.push('/auth');
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                setUser(data);
            } catch (error) {
                console.error('获取用户信息失败:', error);
                router.push('/auth');
            }
        };
        init();
    }, [router]);

    // ✅ 退出登录
    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    // ✅ 获取图数据
    const fetchGraphData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/ideas/graph/data');
            console.log('🔍 API 返回的原始数据:', data);
            setGraphData(data);
        } catch (error) {
            console.error('❌ 获取图数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraphData();
    }, []);

    // ✅ 处理图数据
    const processedGraphData = useMemo(() => {
        if (!graphData?.nodes || !graphData?.links) {
            console.warn('⚠️ graphData 为空');
            return { nodes: [], links: [] };
        }

        const nodes: GraphNode[] = graphData.nodes.map((node: any) => ({
            id: String(node.id),
            label: node.label || node.content?.slice(0, 30) || '未命名',
            content: node.content || '',
            tags: node.tags || [],
            type: node.type || "TEXT",
            createdAt: node.createdAt,
            category: node.category,
        }));

        const links = graphData.links.map((link: any) => ({
            source: String(link.source),
            target: String(link.target),
            strength: link.strength || 0.5,
        }));

        console.log('📊 处理后的图数据:', {
            节点数: nodes.length,
            连线数: links.length,
        });

        return { nodes, links };
    }, [graphData]);

    const handleNodeClick = useCallback((node: GraphNode, event: { clientX: number; clientY: number }) => {
        setSelectedNode({
            node,
            position: { x: event.clientX, y: event.clientY },
        });
    }, []);

    const handleUpdate = useCallback(() => {
        fetchGraphData();
    }, []);

    const handleDelete = useCallback((id: string) => {
        fetchGraphData();
        setSelectedNode(null);
    }, []);

    const allTags = useMemo(() => {
        if (!graphData?.nodes) return new Set();
        return new Set(graphData.nodes.flatMap((node: any) => node.tags || []));
    }, [graphData]);

    // ✅ 等待用户信息加载
    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-300">正在加载...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <MainLayout user={user} onLogout={handleLogout} className="h-screen bg-gray-950">
                <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-gray-300">正在加载灵感星图...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!graphData?.nodes || graphData.nodes.length === 0) {
        return (
            <MainLayout user={user} onLogout={handleLogout} className="h-screen bg-gray-950">
                <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <p className="text-gray-300 text-lg">✨ 暂无灵感数据</p>
                        <p className="text-sm text-gray-400">先去主界面记录一些灵感吧！</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            返回主页
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user} onLogout={handleLogout} className="fixed inset-0 bg-gray-950">
            {/* 移动端搜索框 */}
            <div className="md:hidden fixed right-4 top-[73px] z-30">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 搜索..."
                    className="px-4 py-2 w-48 bg-gray-800/80 backdrop-blur border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                />
            </div>

            {/* 桌面端搜索框 - 集成到导航栏右侧 */}
            <div className="hidden md:block fixed right-48 top-[16px] z-30">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 搜索灵感..."
                    className="px-4 py-2 w-64 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* 力导向图 */}
            <div className=" h-full">
                <ForceGraph
                    data={processedGraphData}
                    onNodeClick={handleNodeClick}
                    searchQuery={searchQuery}
                />
            </div>

            {/* 图例 */}
            <GraphLegend />

            {/* 统计 */}
            <GraphStats
                nodeCount={processedGraphData.nodes.length}
                linkCount={processedGraphData.links.length}
                tagCount={allTags.size}
            />

            {/* 节点详情卡片 */}
            {selectedNode && (
                <NodeDetailCard
                    node={selectedNode.node}
                    position={selectedNode.position}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </MainLayout>
    );
}