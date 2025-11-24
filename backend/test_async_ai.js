// 测试异步AI分析功能
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试数据
const testUser = {
  email: 'lihaozhe1117vip@126.com',
  password: 'lhz981220'
};

const testIdea = {
  content: '学习React Hooks的最佳实践和高级用法'
};

async function testAsyncAI() {
  try {
    console.log('🚀 开始测试异步AI分析功能...\n');

    // 1. 用户登录获取token
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. 创建灵感（异步AI分析）
    console.log('2. 创建灵感（异步AI分析）...');
    const createResponse = await axios.post(`${BASE_URL}/ideas`, testIdea, { headers });
    const idea = createResponse.data;
    console.log('✅ 灵感创建成功');
    console.log('   灵感ID:', idea.id);
    console.log('   AI分析状态:', idea.aiAnalysis?.status);
    console.log('   消息:', idea.aiAnalysis?.message);
    console.log('');

    // 3. 检查AI分析状态
    console.log('3. 检查AI分析状态...');
    const statusResponse = await axios.get(`${BASE_URL}/ideas/${idea.id}/ai-status`, { headers });
    const status = statusResponse.data;
    console.log('   AI分析状态:', status.status);
    console.log('   尝试次数:', status.attempts);
    console.log('   最后尝试时间:', status.lastAttempt);
    console.log('   是否有分析结果:', status.hasAnalysis);
    console.log('');

    // 4. 等待几秒后再次检查状态
    console.log('4. 等待5秒后再次检查状态...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse2 = await axios.get(`${BASE_URL}/ideas/${idea.id}/ai-status`, { headers });
    const status2 = statusResponse2.data;
    console.log('   5秒后AI分析状态:', status2.status);
    console.log('   尝试次数:', status2.attempts);
    console.log('   是否有分析结果:', status2.hasAnalysis);
    
    if (status2.analysis) {
      console.log('   AI分析结果:');
      console.log('     标题:', status2.analysis.title);
      console.log('     分类:', status2.analysis.category);
    }
    console.log('');

    // 5. 测试手动重新分析
    console.log('5. 测试手动重新分析...');
    const reanalyzeResponse = await axios.post(`${BASE_URL}/ideas/${idea.id}/analyze`, {}, { headers });
    console.log('   ✅', reanalyzeResponse.data.message);
    console.log('');

    console.log('🎉 异步AI分析功能测试完成！');
    console.log('');
    console.log('📋 总结:');
    console.log('   - 灵感创建立即返回，不等待AI分析');
    console.log('   - AI分析在后台异步进行');
    console.log('   - 可以随时查询分析状态');
    console.log('   - 支持手动重新触发分析');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAsyncAI();