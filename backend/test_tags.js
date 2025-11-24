const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testTags() {
  try {
    console.log('🚀 测试标签功能...\n');

    // 1. 用户登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. 获取所有笔记
    console.log('2. 获取所有笔记...');
    const ideasResponse = await axios.get(`${BASE_URL}/ideas`, { headers });
    const ideas = ideasResponse.data;
    console.log(`✅ 获取到 ${ideas.length} 条笔记\n`);

    // 3. 检查每条笔记的标签
    ideas.forEach((idea, index) => {
      console.log(`笔记 ${index + 1}:`);
      console.log(`  ID: ${idea.id}`);
      console.log(`  内容: ${idea.content.substring(0, 50)}...`);
      console.log(`  标签数量: ${idea.tags.length}`);
      
      if (idea.tags.length > 0) {
        console.log(`  标签详情:`);
        idea.tags.forEach(tag => {
          console.log(`    - ${tag.name} (${tag.color})`);
        });
      } else {
        console.log(`  无标签`);
      }
      console.log('');
    });

    // 4. 检查数据库中的标签表
    console.log('4. 检查数据库标签表...');
    // 由于模块导入问题，暂时跳过数据库直接检查
    console.log('⚠️ 跳过数据库直接检查，请查看后端日志\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testTags();