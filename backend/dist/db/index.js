"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const DATABASE_URL = "postgresql://neondb_owner:npg_5hLYvVjB7JXZ@ep-misty-breeze-a1h15ywd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
console.log('DATABASE_URL =', DATABASE_URL);
exports.pool = new pg_1.Pool({
    connectionString: DATABASE_URL,
    // 对于本地开发环境，禁用SSL
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
    } : false,
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool);
