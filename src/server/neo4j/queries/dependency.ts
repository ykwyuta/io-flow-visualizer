/** 依存関係分析モード用の Cypher クエリ（粒度別のノード・エッジ）。 */

export type DependencyGranularity = 'system' | 'file' | 'code';

interface GraphQuery {
  nodes: string;
  edges: string;
}

export const DEPENDENCY_QUERIES: Record<DependencyGranularity, GraphQuery> = {
  system: {
    nodes: `MATCH (n:System) RETURN n.id AS id, n.name AS label, 'System' AS kind`,
    edges: `MATCH (a:System)-[:DEPENDS_ON]->(b:System)
            RETURN a.id AS source, b.id AS target, 'DEPENDS_ON' AS label`,
  },
  file: {
    nodes: `MATCH (n:File) RETURN n.id AS id, n.name AS label, 'File' AS kind`,
    edges: `MATCH (a:File)-[:DEPENDS_ON]->(b:File)
            RETURN a.id AS source, b.id AS target, 'DEPENDS_ON' AS label`,
  },
  code: {
    nodes: `MATCH (n) WHERE n:Function OR n:Class OR n:Method OR n:Section
            RETURN n.id AS id, n.name AS label, head(labels(n)) AS kind`,
    edges: `MATCH (a)-[:CALLS]->(b)
            RETURN a.id AS source, b.id AS target, 'CALLS' AS label`,
  },
};

/** IO 実行計画（EXECUTES）を持つ処理単位の id 一覧。code 粒度の横断リンク判定に使う。 */
export const UNITS_WITH_IO_PLAN = `
MATCH (u)-[:EXECUTES]->(:IOOperation) RETURN DISTINCT u.id AS id
`;
