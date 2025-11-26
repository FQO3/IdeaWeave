"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
require("dotenv/config");
(async () => {
    try {
        console.log('Starting database migration...');
        console.log('DATABASE_URL =', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')); // 隐藏密码
        await (0, migrator_1.migrate)(index_1.db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations applied successfully');
    }
    catch (e) {
        console.error('❌ Migration error:', e);
        process.exit(1);
    }
    finally {
        await index_1.pool.end();
    }
})();
