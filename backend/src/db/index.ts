import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const DATABASE_URL = "postgresql://neondb_owner:npg_5hLYvVjB7JXZ@ep-misty-breeze-a1h15ywd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
console.log('DATABASE_URL =', DATABASE_URL);

export const pool = new Pool({
    connectionString: DATABASE_URL,
    // 对于本地开发环境，禁用SSL
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
    } : false,
});
export const db = drizzle(pool);
