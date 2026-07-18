/** ノードリンク図（依存関係・画面関係）の汎用ビューモデル。 */

export interface GraphNode {
  id: string;
  label: string;
  /** ノード種別（色分けに使用。例: System / File / Function / Screen） */
  kind: string;
  /** クリック時に遷移する先（モード横断ドリルダウン用。任意） */
  href?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
