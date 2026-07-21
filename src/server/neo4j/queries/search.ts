/**
 * 検索システム用の Cypher クエリ。
 *
 * 大規模アプリでも通用するよう、全件ロードを避けて「境界付き（LIMIT / ページング）」で返す。
 * - 全文検索インデックス `nodeSearch`（neo4j/schema/indexes.cypher）が存在すれば高速な全文検索を用いる。
 * - 無い場合は CONTAINS ベースのフォールバックに切り替える（リポジトリ層で判定）。
 */

/** 検索・表示対象とするノードラベル（共通ラベル IOTarget は種別表示から除外する） */
export const SEARCHABLE_LABELS = [
  'System',
  'File',
  'Program',
  'Section',
  'Class',
  'Method',
  'Function',
  'Table',
  'DataFile',
  'ExternalSystem',
  'MessageQueue',
  'Session',
  'IOOperation',
  'Screen',
] as const;

export type SearchableLabel = (typeof SEARCHABLE_LABELS)[number];

/**
 * 全文検索（インデックス利用）。
 * $lucene: Lucene 構文の検索文字列（リポジトリ層で組み立てる）。
 * $kinds: 絞り込むラベル（空配列なら絞り込みなし）。
 * $offset / $limit: ページング。
 */
export const FULLTEXT_SEARCH = `
CALL db.index.fulltext.queryNodes('nodeSearch', $lucene) YIELD node, score
WITH node, score, [l IN labels(node) WHERE l <> 'IOTarget'][0] AS kind
WHERE size($kinds) = 0 OR kind IN $kinds
RETURN node.id AS id,
       coalesce(node.name, node.label, node.path, node.id) AS label,
       kind AS kind,
       score AS score
ORDER BY score DESC, label ASC
SKIP $offset LIMIT $limit
`;

/**
 * 全文検索のラベル別ヒット件数（ファセット）。
 * 大規模グラフでの過負荷を避けるため、集計前に上限（$facetCap）を掛ける（概算）。
 */
export const FULLTEXT_FACETS = `
CALL db.index.fulltext.queryNodes('nodeSearch', $lucene) YIELD node
WITH [l IN labels(node) WHERE l <> 'IOTarget'][0] AS kind
LIMIT $facetCap
RETURN kind AS kind, count(*) AS count
ORDER BY count DESC, kind ASC
`;

/**
 * CONTAINS ベースの検索（全文検索インデックスが無い環境向けフォールバック）。
 * $q: 小文字化済みのキーワード（空文字なら全件のうち先頭のみ）。
 * $searchable: 対象ラベル一覧。$kinds: 絞り込みラベル。$offset / $limit: ページング。
 */
export const CONTAINS_SEARCH = `
MATCH (n)
WITH n, [l IN labels(n) WHERE l <> 'IOTarget'][0] AS kind
WHERE kind IN $searchable
  AND (size($kinds) = 0 OR kind IN $kinds)
  AND (
    $q = '' OR
    toLower(coalesce(n.name, '') + ' ' + coalesce(n.label, '') + ' ' +
            coalesce(n.path, '') + ' ' + n.id) CONTAINS $q
  )
RETURN n.id AS id,
       coalesce(n.name, n.label, n.path, n.id) AS label,
       kind AS kind,
       0.0 AS score
ORDER BY label ASC
SKIP $offset LIMIT $limit
`;

/** CONTAINS 検索のラベル別ヒット件数（$facetCap で上限）。 */
export const CONTAINS_FACETS = `
MATCH (n)
WITH n, [l IN labels(n) WHERE l <> 'IOTarget'][0] AS kind
WHERE kind IN $searchable
  AND (
    $q = '' OR
    toLower(coalesce(n.name, '') + ' ' + coalesce(n.label, '') + ' ' +
            coalesce(n.path, '') + ' ' + n.id) CONTAINS $q
  )
WITH kind LIMIT $facetCap
RETURN kind AS kind, count(*) AS count
ORDER BY count DESC, kind ASC
`;

/**
 * 指定ノードの近傍（1 ホップ）を境界付きで取得する。ドリルダウン用。
 * $id: 中心ノード id。$limit: 取得する近傍リレーションの上限。
 */
export const NEIGHBORHOOD = `
MATCH (center {id: $id})
WITH center,
     [l IN labels(center) WHERE l <> 'IOTarget'][0] AS centerKind,
     coalesce(center.name, center.label, center.path, center.id) AS centerLabel
OPTIONAL MATCH (center)-[r]-(m)
WITH center, centerKind, centerLabel, r, m LIMIT $limit
RETURN centerKind AS centerKind,
       centerLabel AS centerLabel,
       type(r) AS relType,
       startNode(r).id AS relSource,
       endNode(r).id AS relTarget,
       m.id AS neighborId,
       coalesce(m.name, m.label, m.path, m.id) AS neighborLabel,
       [l IN labels(m) WHERE l <> 'IOTarget'][0] AS neighborKind
`;

/** 指定 id 群のうち、IO 実行計画（EXECUTES→IOOperation）を持つ処理単位を返す。ドリルダウン付与用。 */
export const IO_PLAN_UNITS_IN = `
MATCH (u)-[:EXECUTES]->(:IOOperation)
WHERE u.id IN $ids
RETURN DISTINCT u.id AS id
`;
