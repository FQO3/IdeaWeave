"use client";

import { useState } from "react";
import { X } from "lucide-react";
import api from "../lib/api";

interface EditReasonModalProps {
    linkId?: string;
    initialReason: string;
    onClose: () => void;
    onSave: (newReason: string) => void;
}

export default function EditReasonModal({
    linkId,
    initialReason,
    onClose,
    onSave
}: EditReasonModalProps) {
    const [reason, setReason] = useState(initialReason);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!linkId) {
            alert("缺少连接ID");
            return;
        }

        if (!reason.trim()) {
            alert("连接理由不能为空");
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/ideas/links/${linkId}`, {
                reason: reason.trim()
            });

            onSave(reason.trim());
        } catch (error) {
            console.error("更新连接理由失败:", error);
            alert("更新失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-gray-700">
                {/* 标题栏 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">编辑连接理由</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* 内容区 */}
                <div className="p-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="请输入连接理由..."
                        disabled={loading}
                        autoFocus
                    />
                </div>

                {/* 按钮区 */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? "保存中..." : "保存"}
                    </button>
                </div>
            </div>
        </div>
    );
}