'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as d3 from 'd3';

interface StarMapBackgroundProps {
  onClick?: () => void;
}

export default function StarMapBackground({ onClick }: StarMapBackgroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除之前的SVG内容
    d3.select(svgRef.current).selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 创建模拟数据 - 在实际应用中，这里应该从API获取真实的笔记数据
    const nodes = [
      { id: 1, title: '企业级应用开发', tags: ['TypeScript', 'Node.js'], x: width * 0.3, y: height * 0.4 },
      { id: 2, title: 'AI灵感记录', tags: ['AI', '灵感'], x: width * 0.7, y: height * 0.3 },
      { id: 3, title: '个人博客规划', tags: ['博客', '规划'], x: width * 0.2, y: height * 0.7 },
      { id: 4, title: 'React Hooks实践', tags: ['React', '前端'], x: width * 0.8, y: height * 0.6 },
      { id: 5, title: '前端开发需求', tags: ['前端', '开发'], x: width * 0.5, y: height * 0.8 }
    ];

    const links = [
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 3, target: 5 },
      { source: 4, target: 5 },
      { source: 1, target: 4 },
      { source: 2, target: 5 }
    ];

    const svg = d3.select(svgRef.current);

    // 添加背景光晕
    const defs = svg.append('defs');
    
    // 创建径向渐变
    const gradient = defs.append('radialGradient')
      .attr('id', 'star-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(59, 130, 246, 0.1)');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(59, 130, 246, 0)');

    // 添加背景
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#star-glow)')
      .attr('opacity', 0.3);

    // 创建力导向图
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // 绘制链接
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'rgba(99, 102, 241, 0.3)')
      .attr('stroke-width', 1)
      .attr('class', 'link');

    // 绘制节点
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // 节点外圈光晕
    node.append('circle')
      .attr('r', 20)
      .attr('fill', 'rgba(59, 130, 246, 0.1)')
      .attr('class', 'node-glow');

    // 节点主体
    node.append('circle')
      .attr('r', 8)
      .attr('fill', 'rgba(99, 102, 241, 0.8)')
      .attr('stroke', 'rgba(255, 255, 255, 0.8)')
      .attr('stroke-width', 2)
      .attr('class', 'node-core');

    // 节点内圈
    node.append('circle')
      .attr('r', 3)
      .attr('fill', 'rgba(255, 255, 255, 1)')
      .attr('class', 'node-inner');

    // 添加节点标题（悬停时显示）
    node.append('title')
      .text(d => `${d.title}\n标签: ${d.tags.join(', ')}`);

    // 力导向图更新
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 添加一些随机星星
    const stars = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    svg.selectAll('.star')
      .data(stars)
      .enter().append('circle')
      .attr('class', 'star')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.size)
      .attr('fill', 'rgba(255, 255, 255, 0.8)')
      .attr('opacity', d => d.opacity);

    // 清理函数
    return () => {
      simulation.stop();
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // 默认行为：跳转到星图页面
      router.push('/app/starmap');
    }
  };

  return (
    <div 
      className="relative w-full h-full cursor-pointer overflow-hidden rounded-2xl border border-blue-200/30 dark:border-blue-700/30 bg-gradient-to-br from-blue-50/20 to-purple-50/20 dark:from-gray-900/30 dark:to-gray-800/30 backdrop-blur-sm"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {/* 星图SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full transition-all duration-500"
        style={{
          filter: isHovering ? 'brightness(1.2) drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' : 'brightness(1)'
        }}
      />
      
      {/* 悬浮提示 */}
      <div className={`
        absolute bottom-4 left-1/2 transform -translate-x-1/2 
        bg-black/50 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full 
        transition-all duration-300
        ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        🗺️ 点击查看完整星图
      </div>
      
      {/* 标题 */}
      <div className="absolute top-4 left-4 text-blue-600 dark:text-blue-400 font-semibold text-sm">
        灵感星图
      </div>
    </div>
  );
}