import { db, pool } from './index';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import 'dotenv/config';

(async () => {
    try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations applied');
    } catch (e) {
        console.error('Migration error:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
