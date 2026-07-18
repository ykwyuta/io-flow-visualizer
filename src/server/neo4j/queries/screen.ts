/** 画面関係分析モード用の Cypher クエリ。 */

export const SCREEN_NODES = `MATCH (n:Screen) RETURN n.id AS id, n.name AS label, 'Screen' AS kind`;

export const SCREEN_EDGES = `
MATCH (a:Screen)-[r:TRANSITIONS_TO]->(b:Screen)
RETURN a.id AS source, b.id AS target, r.trigger AS trigger
`;

/**
 * 画面 → 担当コード（HANDLED_BY）のうち、IO 実行計画を持つものを返す。
 * 画面から IO 分析モードへの横断リンクに使う。
 */
export const SCREEN_IO_HANDLERS = `
MATCH (s:Screen)-[:HANDLED_BY]->(f)
WHERE (f)-[:EXECUTES]->(:IOOperation)
RETURN s.id AS screenId, f.id AS handlerId
`;
