const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testNewIdeaWithTags() {
  try {
    console.log('🚀 创建新笔记测试标签功能...\n');

    // 1. 用户登录
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'tagtest@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. 创建一个新笔记
    console.log('2. 创建新笔记...');
    const newIdeaContent = '学习TypeScript和Node.js开发企业级应用，包括数据库设计、API开发和部署';
    const createResponse = await axios.post(`${BASE_URL}/ideas`, { 
      content: newIdeaContent 
    }, { headers });
    
    const newIdea = createResponse.data;
    console.log('✅ 笔记创建成功');
    console.log(`   笔记ID: ${newIdea.id}`);
    console.log(`   AI分析状态: ${newIdea.aiAnalysis?.status}`);
    console.log(`   消息: ${newIdea.aiAnalysis?.message}`);
    console.log('');

    // 3. 等待AI分析完成
    console.log('3. 等待AI分析完成（30秒）...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 4. 获取笔记详情
    console.log('4. 获取笔记详情...');
    const ideaDetailResponse = await axios.get(`${BASE_URL}/ideas/${newIdea.id}`, { headers });
    const ideaDetail = ideaDetailResponse.data;
    
    console.log('✅ 笔记详情:');
    console.log(`   内容: ${ideaDetail.content}`);
    console.log(`   摘要: ${ideaDetail.summary || '无'}`);
    console.log(`   标题: ${ideaDetail.title || '无'}`);
    console.log(`   分类: ${ideaDetail.category || '无'}`);
    console.log(`   标签数量: ${ideaDetail.tags ? ideaDetail.tags.length : '无'}`);
    
    if (ideaDetail.tags && ideaDetail.tags.length > 0) {
      console.log(`   标签详情:`);
      ideaDetail.tags.forEach(tag => {
        console.log(`     - ${tag.name} (${tag.color})`);
      });
    } else {
      console.log(`   无标签`);
    }
    console.log('');

    // 5. 获取所有笔记检查标签
    console.log('5. 获取所有笔记检查标签...');
    const allIdeasResponse = await axios.get(`${BASE_URL}/ideas`, { headers });
    const allIdeas = allIdeasResponse.data;
    
    console.log(`✅ 总共有 ${allIdeas.length} 条笔记`);
    
    const ideasWithTags = allIdeas.filter(idea => idea.tags && idea.tags.length > 0);
    console.log(`   有标签的笔记: ${ideasWithTags.length} 条`);
    
    if (ideasWithTags.length > 0) {
      console.log('   有标签的笔记详情:');
      ideasWithTags.forEach(idea => {
        console.log(`   - ${idea.content.substring(0, 30)}...`);
        console.log(`     标签: ${idea.tags.map(tag => tag.name).join(', ')}`);
      });
    }
    console.log('');

    console.log('🎉 标签功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testNewIdeaWithTags();