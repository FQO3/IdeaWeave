import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// ✅ 检查环境变量
if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL 环境变量未设置！请检查 .env 文件');
}

console.log('📊 正在连接数据库...');

// ✅ 方案 2：使用独立的连接参数（避免 URL 编码问题）
export const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ideaweave',
    user: 'postgres',
    password: 'K7jR#2bTQmcn3qo*EaPM53KBcf%AJ&',  // ✅ 直接使用原始密码
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
    console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
    console.error('❌ 数据库连接错误:', err);
});

export const db = drizzle(pool, { schema });
