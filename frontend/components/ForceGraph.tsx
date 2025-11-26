"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { GraphNode, GraphLink, GraphData } from "../lib/store";
import { X } from "lucide-react";
import EditReasonModal from "./EditReasonModal";

export interface ForceGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode, event: { clientX: number; clientY: number }) => void;
  onLinkUpdate?: (linkId: string, updatedData: Partial<{ reason: string; strength: number }>) => void;  // ✅ 添加
  onLinkDelete?: (linkId: string) => void;  // ✅ 添加删除回调
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

// ✅ 扩展 GraphLink 添加连接理由
interface ExtendedGraphLink extends GraphLink {
  id?: string;  // ✅ 确保有 id
  reason?: string;
}

export default function ForceGraph({
  data,
  onNodeClick,
  onLinkUpdate,
  onLinkDelete,  // ✅ 添加
  searchQuery = "",
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<ExtendedGraphNode[]>([]);
  const [links, setLinks] = useState<ExtendedGraphLink[]>([]);
  // 在组件顶部添加编辑状态
  const [editingReason, setEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState("");
  const reasonInputRef = useRef<HTMLTextAreaElement | null>(null);
  const exitButtonBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const editButtonBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });  // ✅ 添加
  const deleteButtonBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });  // ✅ 添加
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // ✅ 选中的连线（用于高亮和显示理由）
  // ✅ 修改 selectedLink 类型，包含 linkId
  const [selectedLink, setSelectedLink] = useState<{
    link: ExtendedGraphLink;
    sourceId: string;
    targetId: string;
    linkId?: string;  // ✅ 添加 linkId
  } | null>(null);

  // ✅ 动画目标位置
  const targetPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

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
    if (!data?.nodes) return;

    setNodes(prev => {
      const nodeMap = new Map(prev.map(n => [n.id, n]));

      return data.nodes.map(node => {
        const existing = nodeMap.get(node.id);
        return existing ? {
          ...node,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          mass: getNodeMass((node as any).category),
        } : {
          ...node,
          x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
          y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0,
          mass: getNodeMass((node as any).category),
        };
      });
    });

    // ✅ 每次 data.links 更新时同步
    console.log('🔗 更新连线数据:', data.links);
    setLinks(data.links as ExtendedGraphLink[]);
  }, [data, dimensions]);

  // ✅ 点击连线，将其移动到屏幕中央（考虑屏幕边界）
  const centerLink = useCallback((link: ExtendedGraphLink, sourceNode: ExtendedGraphNode, targetNode: ExtendedGraphNode) => {
    const { width, height } = dimensions;

    // ✅ 计算安全区域（考虑节点半径、标签空间）
    const nodePadding = 80;  // 节点半径 + 下方"起点/终点"标签空间
    const topPadding = 150;  // 上方"连接理由"框的空间
    const bottomPadding = 100;  // 下方标签空间

    const safeLeft = nodePadding;
    const safeRight = width - nodePadding;
    const safeTop = topPadding;
    const safeBottom = height - bottomPadding;

    // ✅ 计算可用空间
    const availableWidth = safeRight - safeLeft;
    const availableHeight = safeBottom - safeTop;

    // ✅ 期望的连线长度（占可用宽度的60%，但不超过400px）
    const desiredLength = Math.min(availableWidth * 0.6, 400);

    // ✅ 计算中心点（垂直方向稍微偏上，给连接理由留空间）
    const centerX = width / 2;
    const centerY = safeTop + availableHeight * 0.5;  // 在安全区域内居中

    // ✅ 设置两个节点的目标位置（水平排列）
    targetPositions.current.clear();
    targetPositions.current.set(sourceNode.id, {
      x: Math.max(safeLeft, Math.min(centerX - desiredLength / 2, safeRight)),
      y: centerY
    });
    targetPositions.current.set(targetNode.id, {
      x: Math.max(safeLeft, Math.min(centerX + desiredLength / 2, safeRight)),
      y: centerY
    });

    // 设置选中状态
    setSelectedLink({
      link,
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      linkId: link.id  // ✅ 保存 linkId
    });

    setEditingReason(false);
    setEditedReason(link.reason || "");
  }, [dimensions]);

  // ✅ 取消选中
  const clearSelection = useCallback(() => {
    setSelectedLink(null);
    targetPositions.current.clear();
    setEditingReason(false);  // ✅ 清除编辑状态
    setEditedReason("");
  }, []);

  // ✅ 物理模拟（带平滑动画）
  // ✅ 物理模拟（优化参数，更柔和）
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationId: number;
    const { width, height } = dimensions;

    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));
        const dragged = draggedNode.current;

        // ✅ 如果有目标位置，平滑移动到目标
        targetPositions.current.forEach((target, nodeId) => {
          const node = newNodes.find(n => n.id === nodeId);
          if (!node) return;

          const dx = target.x - node.x!;
          const dy = target.y - node.y!;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            // 平滑移动（速度与距离成正比）
            const speed = 0.15;
            node.x! += dx * speed;
            node.y! += dy * speed;
            node.vx = 0;
            node.vy = 0;
          } else {
            // 到达目标位置
            node.x = target.x;
            node.y = target.y;
            node.vx = 0;
            node.vy = 0;
          }
        });

        // ✅ 对于没有目标位置的节点，应用物理引擎
        if (targetPositions.current.size === 0) {
          // ✅ 斥力（减弱强度，增加柔和度）
          for (let i = 0; i < newNodes.length; i++) {
            for (let j = i + 1; j < newNodes.length; j++) {
              const dx = newNodes[j].x! - newNodes[i].x!;
              const dy = newNodes[j].y! - newNodes[i].y!;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              // ✅ 减弱斥力：1500 -> 1000，最大力 8 -> 4
              const force = Math.min(1000 / (dist * dist), 4);

              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              const massI = newNodes[i].mass || 1;
              const massJ = newNodes[j].mass || 1;

              // ✅ 增加质量影响，让移动更缓慢
              newNodes[i].vx! -= fx / (massI * 1.5);
              newNodes[i].vy! -= fy / (massI * 1.5);
              newNodes[j].vx! += fx / (massJ * 1.5);
              newNodes[j].vy! += fy / (massJ * 1.5);
            }
          }

          // ✅ 引力（减弱强度）
          links.forEach(link => {
            const source = newNodes.find(n => n.id === link.source);
            const target = newNodes.find(n => n.id === link.target);
            if (!source || !target) return;

            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const strength = link.strength ?? 0.3;

            // ✅ 减弱引力：0.08 -> 0.04，理想距离 120 -> 150
            const force = (dist - 150) * strength * 0.04;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            const massS = source.mass || 1;
            const massT = target.mass || 1;

            source.vx! += fx / (massS * 1.5);
            source.vy! += fy / (massS * 1.5);
            target.vx! -= fx / (massT * 1.5);
            target.vy! -= fy / (massT * 1.5);
          });

          // ❌ 取消向心力
          // const centerX = width / 2;
          // const centerY = height / 2;
          // newNodes.forEach(node => {
          //   const dx = centerX - node.x!;
          //   const dy = centerY - node.y!;
          //   const mass = node.mass || 1;
          //   node.vx! += dx * 0.002 / mass;
          //   node.vy! += dy * 0.002 / mass;
          // });

          // ✅ 更新位置（增强阻尼，减少弹性）
          // ✅ 更新位置（增加阻力，防止匀速运动）
          newNodes.forEach(node => {
            if (dragged?.id === node.id) return;
            if (targetPositions.current.has(node.id)) return;

            // ✅ 详细模式下，冻结未选中的节点
            if (selectedLink && node.id !== selectedLink.sourceId && node.id !== selectedLink.targetId) {
              node.vx = 0;
              node.vy = 0;
              return;
            }

            const mass = node.mass || 1;

            const baseDamping = 0.68;
            const massDamping = (mass - 1) * 0.08;
            const damping = baseDamping + massDamping;

            node.vx! *= damping;
            node.vy! *= damping;

            const stopThreshold = 0.05;
            if (Math.abs(node.vx!) < stopThreshold) node.vx = 0;
            if (Math.abs(node.vy!) < stopThreshold) node.vy = 0;

            const maxSpeed = 5;
            const speed = Math.sqrt(node.vx! ** 2 + node.vy! ** 2);
            if (speed > maxSpeed) {
              node.vx! = (node.vx! / speed) * maxSpeed;
              node.vy! = (node.vy! / speed) * maxSpeed;
            }

            node.x! += node.vx!;
            node.y! += node.vy!;

            const padding = 30;
            const bounceForce = 0.5;

            if (node.x! < padding) {
              node.x = padding;
              node.vx = Math.abs(node.vx!) * bounceForce;
            }
            if (node.x! > width - padding) {
              node.x = width - padding;
              node.vx = -Math.abs(node.vx!) * bounceForce;
            }
            if (node.y! < padding) {
              node.y = padding;
              node.vy = Math.abs(node.vy!) * bounceForce;
            }
            if (node.y! > height - padding) {
              node.y = height - padding;
              node.vy = -Math.abs(node.vy!) * bounceForce;
            }
          });
        }

        return newNodes;
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [nodes.length, links, dimensions, selectedLink]);

  // ✅ 绘制（包括连接理由和黑化效果）
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

    // ✅ 如果有选中的连线，先绘制黑化背景
    if (selectedLink) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(-panOffset.current.x / scale.current, -panOffset.current.y / scale.current, width / scale.current, height / scale.current);
    }

    // 绘制连线
    let drawnLinks = 0;
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);

      if (!source || !target) {
        return;
      }

      const isSelected = selectedLink?.sourceId === source.id && selectedLink?.targetId === target.id;

      // ✅ 选中的连线使用渐变色和更粗的线条
      if (isSelected) {
        const gradient = ctx.createLinearGradient(source.x!, source.y!, target.x!, target.y!);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(0.5, "#8b5cf6");
        gradient.addColorStop(1, "#ec4899");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = Math.max((link.strength ?? 0.3) * 3, 2);
        ctx.globalAlpha = selectedLink ? 0.1 : 0.6;  // ✅ 非选中连线变暗
      }

      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.stroke();

      drawnLinks++;
    });

    ctx.globalAlpha = 1;

    // ✅ 绘制选中连线的理由文本（带编辑和删除功能）
    if (selectedLink) {
      const source = nodes.find(n => n.id === selectedLink.sourceId);
      const target = nodes.find(n => n.id === selectedLink.targetId);

      if (source && target) {
        const reason = selectedLink.link.reason || "未提供连接理由";
        const centerX = (source.x! + target.x!) / 2;
        const centerY = (source.y! + target.y!) / 2;
        const lineWidth = Math.abs(target.x! - source.x!);

        // 计算位置
        const nodePadding = 80;
        const topPadding = 150;
        const safeLeft = nodePadding;
        const safeRight = width - nodePadding;
        const safeTop = topPadding;

        const boxWidth = Math.min(lineWidth * 0.8, 450);
        const lineY = centerY - 30;

        ctx.font = "bold 16px sans-serif";
        const titleHeight = 30;

        // 文字换行处理
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";

        const maxWidth = boxWidth - 40;
        const chars = reason.split('');
        let line = '';
        const lines: string[] = [];

        for (let i = 0; i < chars.length; i++) {
          const testLine = line + chars[i];
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = chars[i];
          } else {
            line = testLine;
          }
        }
        if (line) lines.push(line);

        const lineHeight = 26;
        const contentHeight = lines.length * lineHeight;
        const buttonHeight = 35;
        const buttonGap = 10;  // ✅ 按钮之间的间距
        const totalHeight = titleHeight + contentHeight + buttonHeight + 40;  // ✅ 调整高度
        const boxY = lineY - totalHeight;
        const boxX = centerX - boxWidth / 2;

        // 绘制背景框
        ctx.fillStyle = "rgba(30, 41, 59, 0.98)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, totalHeight, 12);
        ctx.fill();

        // 发光边框
        ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(139, 92, 246, 0.5)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 绘制标题
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "rgba(139, 92, 246, 1)";
        ctx.textBaseline = "top";
        ctx.fillText("连接理由", centerX, boxY + 10);

        // 绘制分隔线
        ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX + 20, boxY + titleHeight);
        ctx.lineTo(boxX + boxWidth - 20, boxY + titleHeight);
        ctx.stroke();

        // 绘制理由内容
        ctx.font = "15px sans-serif";
        ctx.fillStyle = "#e5e7eb";
        ctx.textBaseline = "top";
        lines.forEach((line, i) => {
          ctx.fillText(line, centerX, boxY + titleHeight + 10 + i * lineHeight);
        });

        // ✅ 绘制按钮区域（编辑和删除并排）
        const buttonY = boxY + titleHeight + contentHeight + 20;
        const buttonWidth = 100;
        const editButtonX = centerX - buttonWidth - buttonGap / 2;
        const deleteButtonX = centerX + buttonGap / 2;

        // 检测鼠标悬停
        const mouseCanvasPos = screenToCanvas(lastMousePosition.current.x, lastMousePosition.current.y);

        const isHoveringEdit =
          mouseCanvasPos.x >= editButtonX &&
          mouseCanvasPos.x <= editButtonX + buttonWidth &&
          mouseCanvasPos.y >= buttonY &&
          mouseCanvasPos.y <= buttonY + buttonHeight;

        const isHoveringDelete =
          mouseCanvasPos.x >= deleteButtonX &&
          mouseCanvasPos.x <= deleteButtonX + buttonWidth &&
          mouseCanvasPos.y >= buttonY &&
          mouseCanvasPos.y <= buttonY + buttonHeight;

        // ✅ 绘制编辑按钮
        ctx.fillStyle = isHoveringEdit ? "rgba(139, 92, 246, 0.9)" : "rgba(139, 92, 246, 0.6)";
        ctx.beginPath();
        ctx.roundRect(editButtonX, buttonY, buttonWidth, buttonHeight, 6);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✏️ 编辑", editButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);

        // ✅ 绘制删除按钮
        ctx.fillStyle = isHoveringDelete ? "rgba(239, 68, 68, 0.9)" : "rgba(239, 68, 68, 0.6)";
        ctx.beginPath();
        ctx.roundRect(deleteButtonX, buttonY, buttonWidth, buttonHeight, 6);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🗑️ 删除", deleteButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);

        // ✅ 保存按钮位置供点击检测
        if (!editButtonBounds.current) {
          editButtonBounds.current = { x: 0, y: 0, width: 0, height: 0 };
        }
        if (!deleteButtonBounds.current) {
          deleteButtonBounds.current = { x: 0, y: 0, width: 0, height: 0 };
        }

        editButtonBounds.current = {
          x: editButtonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight
        };

        deleteButtonBounds.current = {
          x: deleteButtonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight
        };

        if (isHoveringEdit || isHoveringDelete) {
          document.body.style.cursor = 'pointer';
        }
      }
    }

    // 绘制节点
    nodes.forEach(node => {
      const isHighlight = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
      const isInSelectedLink = selectedLink && (node.id === selectedLink.sourceId || node.id === selectedLink.targetId);

      // ✅ 非选中节点变暗
      if (selectedLink && !isInSelectedLink) {
        ctx.globalAlpha = 0.2;
      } else {
        ctx.globalAlpha = 1;
      }

      if (isHighlight) {
        const gradient = ctx.createRadialGradient(node.x!, node.y!, 16, node.x!, node.y!, 28);
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      const mass = node.mass || 1;
      const baseRadius = 18;
      const radius = baseRadius + (mass - 1) * 3;  // ✅ 不再因为选中而放大

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);

      // ✅ 保持原本的颜色
      if (isHighlight) {
        ctx.fillStyle = "#ef4444";
      } else {
        ctx.fillStyle = getNodeColor(node.category);
      }
      ctx.fill();

      ctx.strokeStyle = darkenColorPercent(getNodeColor(node.category), 30);
      ctx.lineWidth = 1 + mass * 0.5;
      ctx.stroke();

      // ✅ 节点内始终显示原本的 label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x!, node.y!);

      // ✅ 如果是选中的节点，在下方显示"起点"或"终点"
      if (isInSelectedLink) {
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = node.id === selectedLink.sourceId ? "#3b82f6" : "#ec4899";
        ctx.textBaseline = "top";
        const labelText = node.id === selectedLink.sourceId ? "起点" : "终点";
        ctx.fillText(labelText, node.x!, node.y! + radius + 8);
      }

      if (node.tags && node.tags.length > 0 && !isInSelectedLink) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(node.x! + radius - 6, node.y! - radius + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "9px sans-serif";
        ctx.fillText(node.tags.length.toString(), node.x! + radius - 6, node.y! - radius + 6);
      }
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }, [nodes, links, searchQuery, dimensions, selectedLink]);

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
      const isInSelectedLink = selectedLink && (node.id === selectedLink.sourceId || node.id === selectedLink.targetId);
      const radius = isInSelectedLink ? 18 + 8 : 18 + ((node.mass || 1) - 1) * 3;
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  }, [nodes, selectedLink]);

  // ✅ 查找点击的连线
  const findLinkAtPosition = useCallback((x: number, y: number) => {
    for (const link of links) {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);

      if (!source || !target) continue;

      // 计算点到线段的距离
      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) continue;

      const t = Math.max(0, Math.min(1, ((x - source.x!) * dx + (y - source.y!) * dy) / (length * length)));
      const projX = source.x! + t * dx;
      const projY = source.y! + t * dy;

      const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

      if (distance < 10) {
        return { link, source, target };
      }
    }
    return null;
  }, [nodes, links]);

  // ✅ 鼠标按下（选中状态时禁用画布交互）
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    // ✅ 检测删除按钮点击
    if (selectedLink && deleteButtonBounds.current) {
      const bounds = deleteButtonBounds.current;
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        // 调用删除回调
        if (selectedLink.linkId && onLinkDelete) {
          onLinkDelete(selectedLink.linkId);
          clearSelection();  // 删除后清除选中状态
        }
        return;
      }
    }
    // ✅ 检测编辑按钮点击
    if (selectedLink && editButtonBounds.current) {
      const bounds = editButtonBounds.current;
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        setEditingReason(true);
        return;
      }
    }
    // ✅ 详细模式下的特殊处理
    if (selectedLink) {
      const clickedNode = findNodeAtPosition(x, y);

      // 如果点击了选中的节点，触发编辑
      if (clickedNode && (clickedNode.id === selectedLink.sourceId || clickedNode.id === selectedLink.targetId)) {
        onNodeClick?.(clickedNode, { clientX: e.clientX, clientY: e.clientY });
        return;
      }

      // 如果点击了其他节点，不做任何操作
      if (clickedNode) {
        return;
      }

      // ✅ 点击空白处，允许开始拖拽画布
      isPanning.current = true;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 正常模式下的原有逻辑
    const clickedNode = findNodeAtPosition(x, y);
    if (clickedNode) {
      draggedNode.current = clickedNode;
      offset.current = { x: x - clickedNode.x!, y: y - clickedNode.y! };
      return;
    }

    const clickedLink = findLinkAtPosition(x, y);
    if (clickedLink) {
      centerLink(clickedLink.link, clickedLink.source, clickedLink.target);
      return;
    }

    isPanning.current = true;
    lastPanPosition.current = { x: e.clientX, y: e.clientY };
  }, [screenToCanvas, findNodeAtPosition, findLinkAtPosition, centerLink, selectedLink, onNodeClick]);

  // ✅ 鼠标移动（选中状态时禁用）
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDraggedNode = draggedNode.current;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    // ✅ 详细模式下只允许拖拽画布
    if (selectedLink) {
      if (isPanning.current) {
        const dx = e.clientX - lastPanPosition.current.x;
        const dy = e.clientY - lastPanPosition.current.y;
        panOffset.current.x += dx;
        panOffset.current.y += dy;
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
      }
      return;
    }

    // 正常模式下的原有逻辑
    if (currentDraggedNode) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const mass = currentDraggedNode.mass || 1;

      setNodes(prev =>
        prev.map(node => {
          if (node.id === currentDraggedNode.id) {
            const targetX = x - offset.current.x;
            const targetY = y - offset.current.y;
            const currentX = node.x!;
            const currentY = node.y!;

            const damping = 0.3 / mass;

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
  }, [screenToCanvas, selectedLink]);

  // 鼠标抬起
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // ✅ 详细模式下的处理
    if (selectedLink) {
      isPanning.current = false;
      return;
    }

    // 正常模式下的原有逻辑
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
  }, [screenToCanvas, onNodeClick, selectedLink]);

  // 缩放
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // ✅ 详细模式下也允许缩放
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale.current * delta, 0.3), 3);

    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    panOffset.current.x = mouseX - (mouseX - panOffset.current.x) * (newScale / scale.current);
    panOffset.current.y = mouseY - (mouseY - panOffset.current.y) * (newScale / scale.current);

    scale.current = newScale;
  }, []); // ✅ 移除 selectedLink 依赖

  // 颜色加深
  function darkenColorPercent(hex: string, percent = 20) {
    hex = hex.replace('#', '');

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    const toHex = (n: number) => n.toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Canvas 图层 */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, #0f172a, #1e293b)",
          cursor: selectedLink
            ? (isPanning.current ? "grabbing" : "grab")
            : draggedNode.current
              ? "grabbing"
              : isPanning.current
                ? "grabbing"
                : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* ✅ 关闭按钮 */}
      {selectedLink && (
        <button
          onClick={clearSelection}
          className="fixed top-20 right-6 z-[9999] p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all duration-300 hover:scale-110 group"
          aria-label="关闭详情"
        >
          <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* ✅ 编辑理由弹窗 */}
      {editingReason && selectedLink && (
        <EditReasonModal
          linkId={selectedLink.linkId}
          initialReason={selectedLink.link.reason || ""}
          onClose={() => setEditingReason(false)}
          onSave={(newReason) => {
            console.log('✅ 保存回调触发:', newReason);

            if (!selectedLink.linkId) {
              console.error('❌ linkId 为空');
              return;
            }

            // ✅ 1. 更新父组件的 graphData
            onLinkUpdate?.(selectedLink.linkId, { reason: newReason });

            // ✅ 2. 更新本地的 links 数组
            setLinks(prev => prev.map(link =>
              link.id === selectedLink.linkId
                ? { ...link, reason: newReason }
                : link
            ));

            // ✅ 3. 更新选中的连接状态
            setSelectedLink({
              ...selectedLink,
              link: {
                ...selectedLink.link,
                reason: newReason
              }
            });

            setEditingReason(false);
          }}
        />
      )}
    </div>
  );
}

export type { GraphNode, GraphLink, GraphData };