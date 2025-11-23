import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';
console.log('DATABASE_URL =', JSON.stringify(process.env.DATABASE_URL));

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // 对 Neon 通常需要加这一行
    },
    // 如需兼容 Neon，确保连接串自带 sslmode=require，或这里配置 ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool);
