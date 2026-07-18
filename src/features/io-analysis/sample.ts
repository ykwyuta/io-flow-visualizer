import type { PlanTree } from './types';

/**
 * DB 未接続時のフォールバック用サンプル。
 * neo4j/seed/sample.cypher の REGISTER-ORDER の実行計画ツリーと一致させている。
 */
export const SAMPLE_PLAN_TREE: PlanTree = {
  rootUnit: { id: 'fn:register-order', kind: 'Function', name: 'REGISTER-ORDER' },
  root: {
    id: 'op:0',
    type: 'open',
    label: 'セッション開始',
    targets: [{ label: 'Session', name: 'DB-SESSION', mode: 'write' }],
    children: [
      {
        id: 'op:1',
        type: 'if',
        label: '在庫あり判定',
        targets: [],
        children: [
          {
            id: 'op:2',
            type: 'scan',
            label: 'STOCK 走査',
            estimatedRows: 1000,
            targets: [{ label: 'Table', name: 'STOCK', mode: 'read' }],
            children: [],
          },
          {
            id: 'op:3',
            type: 'insert',
            label: 'ORDERS 追加',
            targets: [{ label: 'Table', name: 'ORDERS', mode: 'write' }],
            children: [],
          },
          {
            id: 'op:4',
            type: 'update',
            label: 'STOCK 更新',
            targets: [{ label: 'Table', name: 'STOCK', mode: 'write' }],
            children: [],
          },
        ],
      },
      {
        id: 'op:5',
        type: 'commit',
        label: 'コミット',
        targets: [],
        children: [],
      },
    ],
  },
};
