const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

async function getData() {
  try {
    const loginResponse = await axios.post(BASE_URL + '/auth/login', {
      email: 'tagtest@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    
    const headers = { Authorization: 'Bearer ' + token };
    
    // 获取笔记数据
    const ideasResponse = await axios.get(BASE_URL + '/ideas', { headers });
    const ideas = ideasResponse.data;
    
    // 获取图谱数据
    const graphResponse = await axios.get(BASE_URL + '/ideas/graph/data', { headers });
    const graphData = graphResponse.data;
    
    console.log('笔记数量:', ideas.length);
    console.log('图谱节点数量:', graphData.nodes.length);
    console.log('图谱链接数量:', graphData.links.length);
    
    // 显示前几个笔记的标题和标签
    console.log('\n前3个笔记:');
    ideas.slice(0, 3).forEach((idea, index) => {
      console.log(`  ${index + 1}. ${idea.title || '无标题'} - 标签: ${idea.tags.map(t => t.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('获取数据失败:', error.response?.data || error.message);
  }
}

getData();