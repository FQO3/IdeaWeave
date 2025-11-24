"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useIdeasStore } from "../../../lib/store";
import type { GraphNode } from "../../../lib/store";
import api from "../../../lib/api";
import ForceGraph from "../../../components/ForceGraph";
import GraphLegend from "../../../components/GraphLegend";
import GraphStats from "../../../components/GraphStats";
import NodeDetailCard from "../../../components/NodeDetailCard";

export default function BrainstormPage() {
    const { graphData, setGraphData } = useIdeasStore();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNode, setSelectedNode] = useState<{
        node: GraphNode;
        position: { x: number; y: number }
    } | null>(null);

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
            id: String(node.id),  // 强制字符串
            label: node.label || node.content?.slice(0, 30) || '未命名',
            content: node.content || '',
            tags: node.tags || [],
            type: node.type || "TEXT",
            createdAt: node.createdAt,
        }));

        const links = graphData.links.map((link: any) => ({
            source: String(link.source),
            target: String(link.target),
            strength: link.strength || 0.5,
        }));

        console.log('📊 处理后的图数据:', {
            节点数: nodes.length,
            连线数: links.length,
            示例节点: nodes[0],
            示例连线: links[0]
        });

        return { nodes, links };
    }, [graphData]);

    // ✅ 节点点击
    const handleNodeClick = useCallback((node: GraphNode, event: { clientX: number; clientY: number }) => {
        console.log('🖱️ 点击节点:', node.label);
        setSelectedNode({
            node,
            position: { x: event.clientX, y: event.clientY },
        });
    }, []);

    // ✅ 更新后刷新数据
    const handleUpdate = useCallback(() => {
        fetchGraphData();
    }, []);

    // ✅ 删除后刷新数据
    const handleDelete = useCallback((id: string) => {
        fetchGraphData();
        setSelectedNode(null);
    }, []);

    const allTags = useMemo(() => {
        if (!graphData?.nodes) return new Set();
        return new Set(graphData.nodes.flatMap((node: any) => node.tags || []));
    }, [graphData]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-300">正在加载灵感星图...</p>
                </div>
            </div>
        );
    }

    if (!graphData?.nodes || graphData.nodes.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-3">
                    <p className="text-gray-300 text-lg">✨ 暂无灵感数据</p>
                    <p className="text-sm text-gray-400">先去主界面记录一些灵感吧！</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 top-[57px] bg-gray-950">
            {/* 搜索框 */}
            <div className="fixed right-4 top-[73px] z-30">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 搜索灵感..."
                    className="px-4 py-2 w-64 bg-gray-800/80 backdrop-blur border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                />
            </div>

            {/* 力导向图 */}
            <ForceGraph
                data={processedGraphData}
                onNodeClick={handleNodeClick}
                searchQuery={searchQuery}
            />

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
                    onUpdate={handleUpdate}  // ✅ 传递更新回调
                    onDelete={handleDelete}  // ✅ 传递删除回调
                />
            )}
        </div>
    );
}