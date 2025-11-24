const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTable() {
  const client = await pool.connect();
  try {
    // 检查ideas表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ideas' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Ideas表结构:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}, default: ${col.column_default}`);
    });
    
    // 检查是否有AI相关字段
    const aiFields = result.rows.filter(col => 
      col.column_name.includes('ai_analysis')
    );
    
    if (aiFields.length === 0) {
      console.log('\n❌ AI分析字段不存在，需要手动创建');
      return false;
    } else {
      console.log('\n✅ AI分析字段已存在');
      return true;
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable().then(hasFields => {
  if (!hasFields) {
    console.log('\n🚀 需要手动创建AI分析字段...');
  }
});