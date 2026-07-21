import type { GraphData } from '@/components/graph/types';

/** 検索結果の 1 件 */
export interface SearchResult {
  id: string;
  /** 表示名（name / label / path / id のいずれか） */
  label: string;
  /** ノード種別（ラベル） */
  kind: string;
  /** 全文検索スコア（フォールバック時は 0） */
  score: number;
  /** IO 実行計画を持つ処理単位なら、IO 分析モードへのドリルダウン先 */
  ioHref?: string;
}

/** ラベル別のヒット件数（ファセット） */
export interface Facet {
  kind: string;
  count: number;
}

/** 構造化検索（絞り込み）のレスポンス */
export interface SearchResponse {
  results: SearchResult[];
  facets: Facet[];
  /** 次ページが存在するか（LIMIT+1 方式で判定） */
  hasMore: boolean;
  /** 全文検索インデックスを使ったか（false は CONTAINS フォールバック） */
  fulltext: boolean;
  /** Neo4j 未接続などでサンプルにフォールバックしたか */
  fallback: boolean;
  /** ファセット件数が上限で頭打ちになっている可能性（概算表示用） */
  facetsApprox: boolean;
}

/** 近傍グラフのレスポンス */
export interface NeighborhoodResponse {
  graph: GraphData;
  fallback: boolean;
}

/** 生 Cypher クエリのレスポンス */
export interface RawCypherResponse {
  keys: string[];
  rows: Record<string, unknown>[];
  /** 上限で切り詰めた場合 true */
  truncated: boolean;
}
