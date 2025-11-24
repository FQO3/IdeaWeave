const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testTags() {
  try {
    console.log('🚀 测试标签功能...\n');

    // 1. 用户登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'tagtest1@example.com',
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

    // 3. 详细检查每条笔记
    ideas.forEach((idea, index) => {
      console.log(`笔记 ${index + 1}:`);
      console.log(`  ID: ${idea.id}`);
      console.log(`  内容: ${idea.content}`);
      console.log(`  摘要: ${idea.summary || '无'}`);
      console.log(`  标题: ${idea.title || '无'}`);
      console.log(`  分类: ${idea.category || '无'}`);
      console.log(`  标签数量: ${idea.tags ? idea.tags.length : 'tags字段不存在'}`);
      
      if (idea.tags && idea.tags.length > 0) {
        console.log(`  标签详情:`);
        idea.tags.forEach(tag => {
          console.log(`    - ${tag.name} (${tag.color})`);
        });
      } else {
        console.log(`  无标签`);
      }
      
      console.log(`  AI分析状态: ${idea.aiAnalysisStatus || '无'}`);
      console.log('');
    });

    console.log('🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testTags();