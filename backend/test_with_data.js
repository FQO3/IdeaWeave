const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testWithData() {
  try {
    console.log('🚀 创建测试数据并检查标签功能...\n');

    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'tagtest1@example.com',
      password: 'password123',
      name: '标签测试用户'
    });
    const token = registerResponse.data.token;
    console.log('✅ 注册成功\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. 创建几个测试笔记
    console.log('2. 创建测试笔记...');
    const testIdeas = [
      '学习React Hooks的最佳实践',
      '规划一个个人博客项目',
      '记录关于AI的灵感想法'
    ];

    for (const content of testIdeas) {
      const createResponse = await axios.post(`${BASE_URL}/ideas`, { content }, { headers });
      console.log(`✅ 创建笔记: ${content.substring(0, 30)}...`);
    }
    console.log('');

    // 3. 等待AI分析完成
    console.log('3. 等待AI分析完成...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 4. 获取所有笔记并检查标签
    console.log('4. 获取所有笔记并检查标签...');
    const ideasResponse = await axios.get(`${BASE_URL}/ideas`, { headers });
    const ideas = ideasResponse.data;
    console.log(`✅ 获取到 ${ideas.length} 条笔记\n`);

    // 5. 详细检查每条笔记
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

testWithData();