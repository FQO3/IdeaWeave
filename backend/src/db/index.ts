import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

console.log('DATABASE_URL =', JSON.stringify(process.env.DATABASE_URL));

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
export const db = drizzle(pool);
