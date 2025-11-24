const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testEditFunctionality() {
  try {
    console.log('🚀 测试编辑功能修复...\n');

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

    // 2. 获取所有笔记
    console.log('2. 获取所有笔记...');
    const ideasResponse = await axios.get(`${BASE_URL}/ideas`, { headers });
    const ideas = ideasResponse.data;
    console.log(`✅ 获取到 ${ideas.length} 条笔记\n`);

    if (ideas.length === 0) {
      console.log('❌ 没有笔记可供测试，请先创建笔记');
      return;
    }

    // 3. 选择第一条笔记进行测试
    const testIdea = ideas[0];
    console.log('3. 测试笔记详情:');
    console.log(`   ID: ${testIdea.id}`);
    console.log(`   内容: ${testIdea.content.substring(0, 50)}...`);
    console.log(`   标签数量: ${testIdea.tags.length}`);
    if (testIdea.tags.length > 0) {
      console.log(`   标签: ${testIdea.tags.map(t => t.name).join(', ')}`);
    }
    console.log('');

    // 4. 测试更新笔记内容
    console.log('4. 测试更新笔记内容...');
    const newContent = `测试编辑功能 - ${new Date().toLocaleString()}\n这是更新后的内容`;
    
    try {
      await axios.patch(`${BASE_URL}/ideas/${testIdea.id}`, { 
        content: newContent 
      }, { headers });
      console.log('✅ 笔记内容更新成功');
    } catch (error) {
      console.error('❌ 笔记内容更新失败:', error.response?.data || error.message);
    }

    // 5. 测试更新标签
    console.log('5. 测试更新标签...');
    const newTags = ['测试标签1', '测试标签2', '测试标签3'];
    
    try {
      // 先获取当前标签
      const currentTags = testIdea.tags || [];
      
      // 删除不存在的标签
      for (const currentTag of currentTags) {
        if (!newTags.includes(currentTag.name)) {
          await axios.delete(`${BASE_URL}/tags/${testIdea.id}/tags/${currentTag.id}`, { headers });
        }
      }
      
      // 添加新标签
      for (const tagName of newTags) {
        const existingTag = currentTags.find(t => t.name === tagName);
        if (!existingTag) {
          // 创建新标签
          const tagResponse = await axios.post(`${BASE_URL}/tags`, { 
            name: tagName
          }, { headers });
          
          // 关联标签到笔记
          await axios.post(`${BASE_URL}/tags/${testIdea.id}/tags`, { 
            tagId: tagResponse.data.id 
          }, { headers });
        }
      }
      
      console.log('✅ 标签更新成功');
    } catch (error) {
      console.error('❌ 标签更新失败:', error.response?.data || error.message);
    }

    // 6. 验证更新结果
    console.log('6. 验证更新结果...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    
    const updatedResponse = await axios.get(`${BASE_URL}/ideas/${testIdea.id}`, { headers });
    const updatedIdea = updatedResponse.data;
    
    console.log('   更新后的笔记:');
    console.log(`   内容: ${updatedIdea.content.substring(0, 50)}...`);
    console.log(`   标签数量: ${updatedIdea.tags.length}`);
    if (updatedIdea.tags.length > 0) {
      console.log(`   标签: ${updatedIdea.tags.map(t => t.name).join(', ')}`);
    }

    console.log('');
    console.log('🎉 编辑功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testEditFunctionality();