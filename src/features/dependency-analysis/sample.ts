import type { GraphData } from '@/components/graph/types';
import type { DependencyGranularity } from '@/server/neo4j/queries/dependency';

/**
 * DB 未接続時のフォールバック用サンプル。
 * neo4j/seed/sample.cypher の依存関係と一致させている。
 */
export const DEPENDENCY_SAMPLES: Record<DependencyGranularity, GraphData> = {
  system: {
    nodes: [
      { id: 'sys:order', label: '受注システム', kind: 'System' },
      { id: 'sys:stock', label: '在庫システム', kind: 'System' },
    ],
    edges: [{ id: 'sys:order->sys:stock', source: 'sys:order', target: 'sys:stock', label: 'DEPENDS_ON' }],
  },
  file: {
    nodes: [
      { id: 'file:order.cbl', label: 'order.cbl', kind: 'File' },
      { id: 'file:stock.cbl', label: 'stock.cbl', kind: 'File' },
    ],
    edges: [
      { id: 'file:order.cbl->file:stock.cbl', source: 'file:order.cbl', target: 'file:stock.cbl', label: 'DEPENDS_ON' },
    ],
  },
  code: {
    nodes: [
      { id: 'fn:register-order', label: 'REGISTER-ORDER', kind: 'Function' },
      { id: 'fn:check-stock', label: 'CHECK-STOCK', kind: 'Function' },
    ],
    edges: [
      { id: 'fn:register-order->fn:check-stock', source: 'fn:register-order', target: 'fn:check-stock', label: 'CALLS' },
    ],
  },
};
