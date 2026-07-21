'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import type { GraphData } from './types';

const NODE_W = 184;
const NODE_H = 46;

/** ノード種別ごとの色（左のアクセントバー） */
const KIND_COLOR: Record<string, string> = {
  System: '#2563eb',
  File: '#0891b2',
  Program: '#0d9488',
  Section: '#65a30d',
  Class: '#7c3aed',
  Method: '#9333ea',
  Function: '#c026d3',
  Table: '#0284c7',
  DataFile: '#0d9488',
  ExternalSystem: '#d97706',
  MessageQueue: '#db2777',
  Session: '#059669',
  IOOperation: '#6366f1',
  Screen: '#ea580c',
};

/** dagre で自動レイアウトし、React Flow 用のノード・エッジへ変換する。 */
function layout(data: GraphData, direction: 'LR' | 'TB'): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 44, ranksep: 92 });

  for (const n of data.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of data.edges) g.setEdge(e.source, e.target);
  dagre.layout(g);

  const nodes: Node[] = data.nodes.map((n) => {
    const pos = g.node(n.id);
    const color = KIND_COLOR[n.kind] ?? '#64748b';
    return {
      id: n.id,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { label: n.label, kind: n.kind, color, href: n.href },
      type: 'flowCard',
      style: { width: NODE_W },
    };
  });

  const edges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    labelShowBg: true,
    style: { stroke: 'var(--rf-edge)', strokeWidth: 1.5 },
    labelStyle: { fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: 'var(--surface)' },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: 'var(--rf-edge)' },
  }));

  return { nodes, edges };
}

/** カード型ノード。左に種別色バー、上に種別、下にラベル。href があればクリック可能表示。 */
function FlowCard({ data }: { data: { label: string; kind: string; color: string; href?: string } }) {
  return (
    <div className={`flow-card${data.href ? ' is-link' : ''}`} style={{ ['--kind' as string]: data.color }}>
      <div className="flow-card-kind">
        {data.kind}
        {data.href && <span className="flow-card-jump">↗</span>}
      </div>
      <div className="flow-card-label" title={data.label}>
        {data.label}
      </div>
    </div>
  );
}

const NODE_TYPES = { flowCard: FlowCard };

export function GraphView({
  data,
  direction = 'LR',
  compact = false,
}: {
  data: GraphData;
  direction?: 'LR' | 'TB';
  compact?: boolean;
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
    <div className={`graph-canvas${compact ? ' graph-canvas--compact' : ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick}
        colorMode="system"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--bg-grid)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
