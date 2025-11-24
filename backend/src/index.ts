import express from 'express';
import cors from 'cors';
import "dotenv/config";
import authRoutes from './routes/auth';
import ideasRoutes from './routes/ideas';
import tagsRoutes from './routes/tags';
import { aiAnalysisWorker } from './services/aiAnalysisWorker';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/tags', tagsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // 启动AI分析工作器
    try {
        await aiAnalysisWorker.start();
        console.log('✅ AI Analysis Worker started successfully');
    } catch (error) {
        console.error('❌ Failed to start AI Analysis Worker:', error);
    }
});
