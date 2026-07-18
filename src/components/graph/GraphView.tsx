'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import type { GraphData } from './types';

const NODE_W = 180;
const NODE_H = 44;

/** ノード種別ごとの色（上辺のアクセント） */
const KIND_COLOR: Record<string, string> = {
  System: '#2563eb',
  File: '#0891b2',
  Program: '#0d9488',
  Section: '#65a30d',
  Class: '#7c3aed',
  Method: '#9333ea',
  Function: '#c026d3',
  Screen: '#ea580c',
};

/** dagre で自動レイアウトし、React Flow 用のノード・エッジへ変換する。 */
function layout(data: GraphData, direction: 'LR' | 'TB'): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });

  for (const n of data.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of data.edges) g.setEdge(e.source, e.target);
  dagre.layout(g);

  const nodes: Node[] = data.nodes.map((n) => {
    const pos = g.node(n.id);
    const color = KIND_COLOR[n.kind] ?? '#475569';
    return {
      id: n.id,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { label: n.href ? `${n.label} ↗` : n.label, href: n.href },
      style: {
        width: NODE_W,
        borderTop: `4px solid ${color}`,
        borderRadius: 8,
        fontSize: 12,
        background: '#ffffff',
        cursor: n.href ? 'pointer' : 'default',
      },
    };
  });

  const edges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return { nodes, edges };
}

export function GraphView({
  data,
  direction = 'LR',
}: {
  data: GraphData;
  direction?: 'LR' | 'TB';
}) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layout(data, direction), [data, direction]);

  const onNodeClick = useCallback(
    (_event: unknown, node: Node) => {
      const href = (node.data as { href?: string }).href;
      if (href) router.push(href);
    },
    [router],
  );

  return (
    <div style={{ height: '70vh', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
