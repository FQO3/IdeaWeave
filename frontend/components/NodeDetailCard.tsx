"use client";

import { useState, useEffect, useRef } from "react";
import { X, Tag, Edit2, Trash2, Calendar, Loader2, GripVertical } from "lucide-react";
import type { GraphNode } from "../lib/store";
import api from "../lib/api";

interface NodeDetailCardProps {
    node: GraphNode;
    position: { x: number; y: number };
    onClose: () => void;
    onUpdate?: (updatedNode: Partial<GraphNode>) => void;  // ✅ 修改类型
    onDelete?: (id: string) => void;
}

// ✅ 标签接口
interface IdeaTag {
    id: string;
    name: string;
    color: string;
}

export default function NodeDetailCard({
    node,
    position,
    onClose,
    onUpdate,
    onDelete
}: NodeDetailCardProps) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingCategory, setEditingCategory] = useState(false);
    const [editingContent, setEditingContent] = useState(false);
    const [title, setTitle] = useState(node.label);
    const [category, setCategory] = useState<string>("");
    const [content, setContent] = useState(node.content);
    const [tags, setTags] = useState<IdeaTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiAnalysisStatus, setAiAnalysisStatus] = useState<string>("");

    // 拖动状态
    const [cardPosition, setCardPosition] = useState(position);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const cardRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // ✅ 从后端获取完整数据（包括标签）
    useEffect(() => {
        const fetchFullData = async () => {
            try {
                const { data } = await api.get(`/ideas/${node.id}`);
                setTitle(data.title || data.summary || node.label);
                setCategory(data.category || "");
                setContent(data.content);
                setTags(data.tags || []);
                setAiAnalysisStatus(data.aiAnalysisStatus || "");
                console.log('📋 获取到的完整数据:', {
                    id: data.id,
                    标签数: data.tags?.length,
                    AI状态: data.aiAnalysisStatus
                });
            } catch (error) {
                console.error("获取详情失败:", error);
            }
        };
        fetchFullData();
    }, [node.id]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // ✅ 拖动逻辑（允许超出左右边界）
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // ✅ 只限制上下边界，不限制左右边界
            const maxY = window.innerHeight - 100;

            setCardPosition({
                x: newX,  // ✅ 移除左右限制
                y: Math.max(0, Math.min(newY, maxY)),
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = 'grabbing';
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // 开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!headerRef.current?.contains(e.target as Node)) return;
        if ((e.target as HTMLElement).closest('button')) return;

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - cardPosition.x,
            y: e.clientY - cardPosition.y,
        });
    };

    // 更新标题
    const handleUpdateTitle = async (newTitle: string) => {
        if (!newTitle.trim()) return;
        setLoading(true);
        try {
            await api.patch(`/ideas/${node.id}`, {
                title: newTitle,
                summary: newTitle
            });
            setTitle(newTitle);
            setEditingTitle(false);

            // ✅ 传递更新（只更新必要字段）
            onUpdate?.({
                id: node.id,
                label: newTitle,
                content: node.content,  // ✅ 保持原有内容
                type: node.type,
                createdAt: node.createdAt,
                tags: node.tags,
                category: node.category,
            });
        } catch (error) {
            console.error("更新标题失败:", error);
            alert("更新失败");
        } finally {
            setLoading(false);
        }
    };

    // 更新分类
    const handleUpdateCategory = async (newCategory: string) => {
        setLoading(true);
        try {
            await api.patch(`/ideas/${node.id}`, { category: newCategory });
            setCategory(newCategory);
            setEditingCategory(false);

            // ✅ 传递完整更新
            onUpdate?.({
                id: node.id,
                label: node.label,
                content: node.content,
                type: node.type,
                createdAt: node.createdAt,
                tags: node.tags,
                category: newCategory,  // ✅ 只更新分类
            });
        } catch (error) {
            console.error("更新分类失败:", error);
            alert("更新失败");
        } finally {
            setLoading(false);
        }
    };

    // 更新内容
    const handleUpdateContent = async (newContent: string) => {
        if (!newContent.trim()) return;
        setLoading(true);
        try {
            await api.patch(`/ideas/${node.id}`, { content: newContent });
            setContent(newContent);
            setEditingContent(false);

            // ✅ 传递完整更新
            onUpdate?.({
                id: node.id,
                label: node.label,
                content: newContent,  // ✅ 只更新内容
                type: node.type,
                createdAt: node.createdAt,
                tags: node.tags,
                category: node.category,
            });
        } catch (error) {
            console.error("更新内容失败:", error);
            alert("更新失败");
        } finally {
            setLoading(false);
        }
    };

    // 删除
    const handleDelete = async () => {
        if (!confirm("确定要删除这条灵感吗？")) return;

        setLoading(true);
        try {
            await api.delete(`/ideas/${node.id}`);
            onDelete?.(node.id);
            onClose();
        } catch (error) {
            console.error("删除失败:", error);
            alert("删除失败");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "TODO":
                return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700";
            case "PLAN":
                return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700";
            case "INSPIRATION":
                return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700";
            default:
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case "TODO": return "待办";
            case "PLAN": return "规划";
            case "INSPIRATION": return "灵感";
            default: return cat;
        }
    };

    const cardStyle = {
        left: cardPosition.x,
        top: cardPosition.y,
        maxHeight: window.innerHeight - 100,
    };

    return (
        <div
            ref={cardRef}
            className="fixed z-50 w-[400px] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            style={cardStyle}
            onMouseDown={handleMouseDown}
        >
            {/* 可拖动的顶部操作栏 */}
            <div
                ref={headerRef}
                className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 opacity-60" />
                    <h3 className="font-semibold text-sm">灵感详情</h3>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <button
                        onClick={handleDelete}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                        disabled={loading}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="p-4 space-y-4 overflow-y-auto bg-white dark:bg-gray-800" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {/* 标题和分类 */}
                <div className="space-y-2">
                    {/* 标题 */}
                    {editingTitle ? (
                        <input
                            defaultValue={title}
                            onBlur={(e) => handleUpdateTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleUpdateTitle(e.currentTarget.value);
                                } else if (e.key === "Escape") {
                                    setEditingTitle(false);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 border-2 border-blue-500 dark:border-blue-400 rounded-lg outline-none"
                            maxLength={50}
                            autoFocus
                            disabled={loading}
                        />
                    ) : (
                        <div
                            onClick={() => setEditingTitle(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
                        >
                            <span className="flex-1 text-sm font-medium text-blue-800 dark:text-blue-200">
                                {title || "未命名"}
                            </span>
                            <Edit2 className="w-3 h-3 text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}

                    {/* 分类 */}
                    <div className="flex items-center gap-2">
                        {editingCategory ? (
                            <select
                                value={category}
                                onChange={(e) => handleUpdateCategory(e.target.value)}
                                onBlur={() => setEditingCategory(false)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border-2 outline-none ${getCategoryColor(category)}`}
                                autoFocus
                                disabled={loading}
                            >
                                <option value="">无分类</option>
                                <option value="TODO">待办</option>
                                <option value="PLAN">规划</option>
                                <option value="INSPIRATION">灵感</option>
                            </select>
                        ) : (
                            <span
                                onClick={() => setEditingCategory(true)}
                                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity ${category ? getCategoryColor(category) : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                {category ? getCategoryLabel(category) : "添加分类"}
                            </span>
                        )}
                    </div>
                </div>

                {/* 内容 */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        内容
                    </label>
                    {editingContent ? (
                        <textarea
                            defaultValue={content}
                            onBlur={(e) => handleUpdateContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setEditingContent(false);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                            rows={6}
                            autoFocus
                            disabled={loading}
                        />
                    ) : (
                        <div
                            onClick={() => setEditingContent(true)}
                            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-pre-wrap min-h-[120px]"
                        >
                            {content || "点击编辑内容"}
                        </div>
                    )}
                </div>

                {/* ✅ 标签显示区域（与 IdeaList 一致） */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        标签
                    </label>
                    {tags && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 animate-in fade-in-50 slide-in-from-top-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        // ✅ AI 分析中动画（与 IdeaList 一致）
                        (aiAnalysisStatus === 'pending' || aiAnalysisStatus === 'processing') ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>AI正在分析中，即将生成标签...</span>
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                暂无标签
                            </div>
                        )
                    )}
                </div>

                {/* 类型和创建时间 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        {node.type === "IMAGE" ? "🖼️ 图片" : "📝 文本"}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(node.createdAt).toLocaleString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}