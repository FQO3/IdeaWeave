import { db, pool } from './index';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import 'dotenv/config';

(async () => {
    try {
        console.log('Starting database migration...');
        console.log('DATABASE_URL =', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')); // 隐藏密码
        
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations applied successfully');
    } catch (e) {
        console.error('❌ Migration error:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
