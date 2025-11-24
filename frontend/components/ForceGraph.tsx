"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { GraphNode, GraphLink, GraphData } from "../lib/store";
import { Hexagon } from "lucide-react";

export interface ForceGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode, event: { clientX: number; clientY: number }) => void;
  searchQuery?: string;
}

// ✅ 扩展 GraphNode 添加分类和重量
interface ExtendedGraphNode extends GraphNode {
  category?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  mass?: number;  // 节点质量
}

export default function ForceGraph({
  data,
  onNodeClick,
  searchQuery = "",
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<ExtendedGraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  
  const draggedNode = useRef<ExtendedGraphNode | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const scale = useRef(1);
  const panOffset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  // ✅ 根据分类获取节点颜色
  const getNodeColor = (category?: string) => {
    switch (category) {
      case "TODO":
        return "#fb923c";  // 橘色
      case "PLAN":
        return "#10b981";  // 绿色
      case "INSPIRATION":
        return "#3b82f6";  // 蓝色
      default:
        return "#6b7280";  // 灰色（未分类）
    }
  };

  // ✅ 根据分类获取节点质量（影响移动难度）
  const getNodeMass = (category?: string) => {
    switch (category) {
      case "PLAN":
        return 3;  // 规划类最重（最难移动）
      case "TODO":
        return 2;  // 待办类中等
      case "INSPIRATION":
        return 1;  // 灵感类最轻（最容易移动）
      default:
        return 1.5;
    }
  };

  // 响应式尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 初始化节点位置
  useEffect(() => {
    console.log('🎯 ForceGraph 收到数据:', { 
      节点数: data.nodes.length, 
      连线数: data.links.length,
      示例节点: data.nodes[0],
      示例连线: data.links[0]
    });

    const { width, height } = dimensions;
    const initializedNodes = data.nodes.map((node) => ({
      ...node,
      x: node.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: node.y ?? height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      mass: getNodeMass((node as any).category),  // ✅ 设置质量
    }));
    setNodes(initializedNodes);
    setLinks(data.links);
  }, [data, dimensions]);

  // ✅ 物理模拟（考虑质量）
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationId: number;
    const { width, height } = dimensions;

    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));
        const dragged = draggedNode.current;

        // ✅ 斥力（考虑质量）
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x! - newNodes[i].x!;
            const dy = newNodes[j].y! - newNodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = Math.min(2000 / (dist * dist), 8);

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            // ✅ 力的影响与质量成反比
            const massI = newNodes[i].mass || 1;
            const massJ = newNodes[j].mass || 1;

            newNodes[i].vx! -= fx / massI;
            newNodes[i].vy! -= fy / massI;
            newNodes[j].vx! += fx / massJ;
            newNodes[j].vy! += fy / massJ;
          }
        }

        // ✅ 引力（考虑质量）
        links.forEach(link => {
          const source = newNodes.find(n => n.id === link.source);
          const target = newNodes.find(n => n.id === link.target);
          if (!source || !target) return;

          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const strength = link.strength ?? 0.3;
          const force = (dist - 120) * strength * 0.08;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          const massS = source.mass || 1;
          const massT = target.mass || 1;

          source.vx! += fx / massS;
          source.vy! += fy / massS;
          target.vx! -= fx / massT;
          target.vy! -= fy / massT;
        });

        // 向中心的力
        const centerX = width / 2;
        const centerY = height / 2;
        newNodes.forEach(node => {
          const dx = centerX - node.x!;
          const dy = centerY - node.y!;
          const mass = node.mass || 1;
          node.vx! += dx * 0.002 / mass;
          node.vy! += dy * 0.002 / mass;
        });

        // ✅ 更新位置（阻尼与质量相关）
        newNodes.forEach(node => {
          if (dragged?.id === node.id) return;

          const mass = node.mass || 1;
          const damping = 0.85 + (mass - 1) * 0.05;  // 质量越大，阻尼越大

          node.vx! *= damping;
          node.vy! *= damping;

          node.x! += node.vx!;
          node.y! += node.vy!;

          // 边界
          if (node.x! < 30) { node.x = 30; node.vx = 0; }
          if (node.x! > width - 30) { node.x = width - 30; node.vx = 0; }
          if (node.y! < 30) { node.y = 30; node.vy = 0; }
          if (node.y! > height - 30) { node.y = height - 30; node.vy = 0; }
        });

        return newNodes;
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [nodes.length, links, dimensions]);
  
  // ✅ 绘制（使用分类颜色）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;

    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(panOffset.current.x, panOffset.current.y);
    ctx.scale(scale.current, scale.current);

    // 绘制连线
    let drawnLinks = 0;
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      
      if (!source || !target) {
        console.warn('❌ 连线缺少节点:', { 
          link, 
          sourceId: link.source,
          targetId: link.target,
          availableIds: nodes.map(n => n.id).slice(0, 5) + '...' 
        });
        return;
      }

      ctx.strokeStyle = "#60a5fa";
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = Math.max(link.strength * 3, 2);
      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.stroke();
      drawnLinks++;
    });

    if (links.length > 0 && drawnLinks === 0) {
      console.error('🚨 有连线数据但没有绘制任何线！');
    } else if (links.length > 0) {
      console.log(`✅ 成功绘制 ${drawnLinks}/${links.length} 条连线`);
    }

    ctx.globalAlpha = 1;

    // ✅ 绘制节点（使用分类颜色）
    nodes.forEach(node => {
      const isHighlight = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 高亮光晕
      if (isHighlight) {
        const gradient = ctx.createRadialGradient(node.x!, node.y!, 16, node.x!, node.y!, 28);
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // ✅ 根据质量调整节点大小
      const mass = node.mass || 1;
      const baseRadius = 18;
      const radius = baseRadius + (mass - 1) * 3;  // 质量越大，节点越大

      // 主圆形
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
      
      // ✅ 使用分类颜色
      if (isHighlight) {
        ctx.fillStyle = "#ef4444";  // 搜索高亮保持红色
      } else {
        ctx.fillStyle = getNodeColor(node.category);
      }
      ctx.fill();
      
      // ✅ 边框宽度与质量相关
      ctx.strokeStyle = darkenColorPercent(getNodeColor(node.category), 30);
      ctx.lineWidth = 1 + mass * 0.5;
      ctx.stroke();

      // 节点文字
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x!, node.y!);

      // 标签数量指示器
      if (node.tags && node.tags.length > 0) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(node.x! + radius - 6, node.y! - radius + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "9px sans-serif";
        ctx.fillText(node.tags.length.toString(), node.x! + radius - 6, node.y! - radius + 6);
      }
    });

    ctx.restore();
  }, [nodes, links, searchQuery, dimensions]);

  // 屏幕坐标转画布坐标
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.current.x) / scale.current;
    const y = (clientY - rect.top - panOffset.current.y) / scale.current;
    return { x, y };
  }, []);

  // 查找点击的节点
  const findNodeAtPosition = useCallback((x: number, y: number) => {
    return nodes.find(node => {
      const radius = 18 + ((node.mass || 1) - 1) * 3;
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }, [nodes]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const clicked = findNodeAtPosition(x, y);

    if (clicked) {
      draggedNode.current = clicked;
      offset.current = { x: x - clicked.x!, y: y - clicked.y! };
    } else {
      isPanning.current = true;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [screenToCanvas, findNodeAtPosition]);

  // ✅ 鼠标移动（考虑质量阻力）
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDraggedNode = draggedNode.current;
    
    if (currentDraggedNode) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const mass = currentDraggedNode.mass || 1;
      
      setNodes(prev =>
        prev.map(node => {
          if (node.id === currentDraggedNode.id) {
            // ✅ 质量越大，拖动时的响应速度越慢
            const targetX = x - offset.current.x;
            const targetY = y - offset.current.y;
            const currentX = node.x!;
            const currentY = node.y!;
            
            // 使用插值实现"重量感"
            const damping = 0.3 / mass;  // 质量越大，移动越慢
            
            return {
              ...node,
              x: currentX + (targetX - currentX) * damping,
              y: currentY + (targetY - currentY) * damping,
              vx: 0,
              vy: 0
            };
          }
          return node;
        })
      );
    } else if (isPanning.current) {
      const dx = e.clientX - lastPanPosition.current.x;
      const dy = e.clientY - lastPanPosition.current.y;
      panOffset.current.x += dx;
      panOffset.current.y += dy;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [screenToCanvas]);

  // 鼠标抬起
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDraggedNode = draggedNode.current;
    
    if (currentDraggedNode) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const dx = x - offset.current.x - currentDraggedNode.x!;
      const dy = y - offset.current.y - currentDraggedNode.y!;
      
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        onNodeClick?.(currentDraggedNode, { clientX: e.clientX, clientY: e.clientY });
      }
      
      draggedNode.current = null;
    }
    isPanning.current = false;
  }, [screenToCanvas, onNodeClick]);

  // 缩放
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale.current * delta, 0.3), 3);
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    panOffset.current.x = mouseX - (mouseX - panOffset.current.x) * (newScale / scale.current);
    panOffset.current.y = mouseY - (mouseY - panOffset.current.y) * (newScale / scale.current);
    
    scale.current = newScale;
  }, []);

  // 颜色加深
  function darkenColorPercent(hex : string, percent = 20) {
    hex = hex.replace('#', '');

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // 按百分比减少
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    const toHex = (n) => n.toString(16).padStart(2, '0');
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, #0f172a, #1e293b)",
          cursor: draggedNode.current ? "grabbing" : isPanning.current ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}

export type { GraphNode, GraphLink, GraphData };