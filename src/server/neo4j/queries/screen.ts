/** 画面関係分析モード用の Cypher クエリ。 */

export const SCREEN_NODES = `MATCH (n:Screen) RETURN n.id AS id, n.name AS label, 'Screen' AS kind`;

export const SCREEN_EDGES = `
MATCH (a:Screen)-[r:TRANSITIONS_TO]->(b:Screen)
RETURN a.id AS source, b.id AS target, r.trigger AS trigger
`;
