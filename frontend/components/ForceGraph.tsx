"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export interface GraphNode {
  id: string;
  label: string;
  content: string;
  tags: string[];
  type: string;
  createdAt: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ForceGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode, event: { clientX: number; clientY: number }) => void;
  searchQuery?: string;
}

export default function ForceGraph({
  data,
  onNodeClick,
  searchQuery = "",
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  
  const draggedNode = useRef<GraphNode | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const scale = useRef(1);
  const panOffset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    const { width, height } = dimensions;
    const initializedNodes = data.nodes.map((node) => ({
      ...node,
      x: node.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: node.y ?? height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));
    setNodes(initializedNodes);
    setLinks(data.links);
  }, [data, dimensions]);

  useEffect(() => {
    if (nodes.length === 0) return;

    let animationId: number;
    const { width, height } = dimensions;

    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));
        const dragged = draggedNode.current;  // ✅ 保存引用

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x! - newNodes[i].x!;
            const dy = newNodes[j].y! - newNodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = Math.min(2000 / (dist * dist), 8);

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            newNodes[i].vx! -= fx;
            newNodes[i].vy! -= fy;
            newNodes[j].vx! += fx;
            newNodes[j].vy! += fy;
          }
        }

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

          source.vx! += fx;
          source.vy! += fy;
          target.vx! -= fx;
          target.vy! -= fy;
        });

        const centerX = width / 2;
        const centerY = height / 2;
        newNodes.forEach(node => {
          const dx = centerX - node.x!;
          const dy = centerY - node.y!;
          node.vx! += dx * 0.002;
          node.vy! += dy * 0.002;
        });

        newNodes.forEach(node => {
          if (dragged?.id === node.id) return;  // ✅ 使用局部变量

          node.vx! *= 0.85;
          node.vy! *= 0.85;

          node.x! += node.vx!;
          node.y! += node.vy!;

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

        links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (!source || !target) return;

      ctx.strokeStyle = "#60a5fa";
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = Math.max(link.strength * 3, 1.5);
      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    nodes.forEach(node => {
      const isHighlight = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (isHighlight) {
        const gradient = ctx.createRadialGradient(node.x!, node.y!, 16, node.x!, node.y!, 28);
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, 18, 0, Math.PI * 2);
      
      if (isHighlight) {
        ctx.fillStyle = "#ef4444";
      } else if (node.type === "IMAGE") {
        ctx.fillStyle = "#10b981";
      } else {
        ctx.fillStyle = "#3b82f6";
      }
      ctx.fill();
      
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label.slice(0, 8), node.x!, node.y!);

      if (node.tags.length > 0) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(node.x! + 12, node.y! - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "9px sans-serif";
        ctx.fillText(node.tags.length.toString(), node.x! + 12, node.y! - 12);
      }
    });

    ctx.restore();
  }, [nodes, links, searchQuery, dimensions]);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.current.x) / scale.current;
    const y = (clientY - rect.top - panOffset.current.y) / scale.current;
    return { x, y };
  }, []);

  const findNodeAtPosition = useCallback((x: number, y: number) => {
    return nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < 18;
    });
  }, [nodes]);

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDraggedNode = draggedNode.current;  // ✅ 关键修复
    
    if (currentDraggedNode) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setNodes(prev =>
        prev.map(node =>
          node.id === currentDraggedNode.id  // ✅ 使用局部变量
            ? { ...node, x: x - offset.current.x, y: y - offset.current.y, vx: 0, vy: 0 }
            : node
        )
      );
    } else if (isPanning.current) {
      const dx = e.clientX - lastPanPosition.current.x;
      const dy = e.clientY - lastPanPosition.current.y;
      panOffset.current.x += dx;
      panOffset.current.y += dy;
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [screenToCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDraggedNode = draggedNode.current;  // ✅ 保存引用
    
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