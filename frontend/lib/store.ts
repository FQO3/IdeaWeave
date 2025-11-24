import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    restore: () => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('token', token);
        set({ user, token });
    },
    restore: async () => {
        try {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('restore failed');
            const { user } = await res.json();
            set({ user, token });
        } catch {
            localStorage.removeItem('token');
            set({ user: null, token: null });
        }
    },
    logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        set({ user: null, token: null });
    }
}));

// 原有的 Idea 接口
interface Idea {
    id: string;
    content: string;
    summary?: string;
    type: string;
    category?: string;
    title?: string;
    createdAt: string;
    tags: Array<{ id: string; name: string; color: string }>;
    aiAnalysisStatus?: string;
    aiAnalysis?: {
        title: string;
        category: string;
        relatedIdeas?: Array<{
            ideaId: string;
            reason: string;
            strength: number;
        }>;
    };
}

// ✅ 新增：图数据专用接口
interface GraphNode {
    id: string;
    label: string;
    content: string;
    tags: string[];
    type: string;
    createdAt: string;
    category?: string;
}

interface GraphLink {
    source: string;
    target: string;
    strength: number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// ✅ 修改：扩展 Store 状态
interface IdeasState {
    ideas: Idea[];
    graphData: GraphData | null;
    setIdeas: (ideas: Idea[]) => void;
    setGraphData: (data: GraphData | null) => void;  // ✅ 允许传入 null
    addIdea: (idea: Idea) => void;
    removeIdea: (id: string) => void;
}

export const useIdeasStore = create<IdeasState>((set) => ({
    ideas: [],
    graphData: null,
    setIdeas: (ideas) => set({ ideas }),
    setGraphData: (data) => set({ graphData: data }),  // ✅ 保持不变，这个是对的
    addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
    removeIdea: (id) => set((state) => ({
        ideas: state.ideas.filter(i => i.id !== id)
    }))
}));

// ✅ 导出类型供其他文件使用
export type { Idea, GraphNode, GraphLink, GraphData };