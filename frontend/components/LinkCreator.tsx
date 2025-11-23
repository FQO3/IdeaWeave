'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function LinkCreator() {
    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');
    const [reason, setReason] = useState('');
    const [strength, setStrength] = useState(0.6);
    const [msg, setMsg] = useState('');

    const createLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromId || !toId) return;
        try {
            await api.post(`/ideas/${fromId}/links`, { targetId: toId, reason, strength });
            setMsg('已创建链路');
        } catch (err: unknown) {
            let msg = '创建失败';

            if (err && typeof err === 'object' && 'response' in err) {
                const e = err as {
                    response?: { data?: { error?: string } };
                };
                msg = e.response?.data?.error ?? msg;
            }

            setMsg(msg);
        }
    };

    return (
        <form onSubmit={createLink} className="p-4 border rounded-lg space-y-2">
            <div className="flex gap-2">
                <input className="border p-2 flex-1" placeholder="From Idea ID" value={fromId} onChange={(e) => setFromId(e.target.value)} />
                <input className="border p-2 flex-1" placeholder="To Idea ID" value={toId} onChange={(e) => setToId(e.target.value)} />
            </div>
            <input className="border p-2 w-full" placeholder="关联理由（可选）" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">强度</label>
                <input type="range" min={0.1} max={1} step={0.05} value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} />
                <span className="text-sm">{strength.toFixed(2)}</span>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded">创建链路</button>
            {msg && <p className="text-sm text-gray-600">{msg}</p>}
        </form>
    );
}
