"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const auth_1 = __importDefault(require("./routes/auth"));
const ideas_1 = __importDefault(require("./routes/ideas"));
const tags_1 = __importDefault(require("./routes/tags"));
const aiAnalysisWorker_1 = require("./services/aiAnalysisWorker");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/ideas', ideas_1.default);
app.use('/api/tags', tags_1.default);
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // 启动AI分析工作器
    try {
        await aiAnalysisWorker_1.aiAnalysisWorker.start();
        console.log('✅ AI Analysis Worker started successfully');
    }
    catch (error) {
        console.error('❌ Failed to start AI Analysis Worker:', error);
    }
});
