/**
 * DB 未接続時のフォールバック用サンプル（検索システム）。
 * neo4j/seed/sample.cypher のノード・リレーションと一致させている。
 * 大規模データは無いが、Neo4j 無しでも検索 UI の挙動を確認できるようにする。
 */

export interface SampleNode {
  id: string;
  label: string;
  kind: string;
  /** IO 実行計画（EXECUTES）を持つ処理単位か */
  ioPlan?: boolean;
}

export interface SampleEdge {
  source: string;
  target: string;
  label: string;
}

export const SEARCH_SAMPLE_NODES: SampleNode[] = [
  { id: 'sys:order', label: '受注システム', kind: 'System' },
  { id: 'sys:stock', label: '在庫システム', kind: 'System' },
  { id: 'file:order.cbl', label: 'order.cbl', kind: 'File' },
  { id: 'file:stock.cbl', label: 'stock.cbl', kind: 'File' },
  { id: 'fn:register-order', label: 'REGISTER-ORDER', kind: 'Function', ioPlan: true },
  { id: 'fn:check-stock', label: 'CHECK-STOCK', kind: 'Function' },
  { id: 'tbl:orders', label: 'ORDERS', kind: 'Table' },
  { id: 'tbl:stock', label: 'STOCK', kind: 'Table' },
  { id: 'sess:db', label: 'DB-SESSION', kind: 'Session' },
  { id: 'op:0', label: 'セッション開始', kind: 'IOOperation' },
  { id: 'op:1', label: '在庫あり判定', kind: 'IOOperation' },
  { id: 'op:2', label: 'STOCK 走査', kind: 'IOOperation' },
  { id: 'op:3', label: 'ORDERS 追加', kind: 'IOOperation' },
  { id: 'op:4', label: 'STOCK 更新', kind: 'IOOperation' },
  { id: 'op:5', label: 'コミット', kind: 'IOOperation' },
  { id: 'screen:order-list', label: '受注一覧', kind: 'Screen' },
  { id: 'screen:order-new', label: '受注登録', kind: 'Screen' },
  { id: 'screen:order-done', label: '登録完了', kind: 'Screen' },
];

export const SEARCH_SAMPLE_EDGES: SampleEdge[] = [
  { source: 'sys:order', target: 'sys:stock', label: 'DEPENDS_ON' },
  { source: 'sys:order', target: 'file:order.cbl', label: 'CONTAINS' },
  { source: 'sys:stock', target: 'file:stock.cbl', label: 'CONTAINS' },
  { source: 'file:order.cbl', target: 'file:stock.cbl', label: 'DEPENDS_ON' },
  { source: 'file:order.cbl', target: 'fn:register-order', label: 'DEFINES' },
  { source: 'file:stock.cbl', target: 'fn:check-stock', label: 'DEFINES' },
  { source: 'fn:register-order', target: 'fn:check-stock', label: 'CALLS' },
  { source: 'fn:register-order', target: 'op:0', label: 'EXECUTES' },
  { source: 'op:0', target: 'op:1', label: 'CHILD' },
  { source: 'op:0', target: 'op:5', label: 'CHILD' },
  { source: 'op:1', target: 'op:2', label: 'CHILD' },
  { source: 'op:1', target: 'op:3', label: 'CHILD' },
  { source: 'op:1', target: 'op:4', label: 'CHILD' },
  { source: 'op:0', target: 'sess:db', label: 'ACCESSES' },
  { source: 'op:2', target: 'tbl:stock', label: 'ACCESSES' },
  { source: 'op:3', target: 'tbl:orders', label: 'ACCESSES' },
  { source: 'op:4', target: 'tbl:stock', label: 'ACCESSES' },
  { source: 'screen:order-list', target: 'screen:order-new', label: 'TRANSITIONS_TO' },
  { source: 'screen:order-new', target: 'screen:order-done', label: 'TRANSITIONS_TO' },
  { source: 'screen:order-new', target: 'fn:register-order', label: 'HANDLED_BY' },
];
