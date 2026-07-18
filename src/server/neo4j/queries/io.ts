/** IO分析モード用の Cypher クエリ。 */

/** IO 実行計画を持つ処理単位（EXECUTES の始点）の一覧 */
export const LIST_IO_ROOT_UNITS = `
MATCH (u)-[:EXECUTES]->(:IOOperation)
RETURN u.id AS id, head(labels(u)) AS kind, u.name AS name
ORDER BY name
`;

/** 指定した処理単位配下の IOOperation ノード一覧（根フラグ付き） */
export const IO_PLAN_OPERATIONS = `
MATCH (u {id: $rootUnitId})-[:EXECUTES]->(r:IOOperation)
MATCH (r)-[:CHILD*0..]->(op:IOOperation)
RETURN DISTINCT
  r.id AS rootOpId,
  op.id AS id,
  op.type AS type,
  op.label AS label,
  op.estimatedRows AS estimatedRows,
  op.estimatedCost AS estimatedCost
`;

/** 指定した処理単位配下の CHILD エッジ（実行順付き） */
export const IO_PLAN_EDGES = `
MATCH (u {id: $rootUnitId})-[:EXECUTES]->(r:IOOperation)
MATCH (r)-[:CHILD*0..]->(p:IOOperation)-[c:CHILD]->(ch:IOOperation)
RETURN p.id AS parentId, ch.id AS childId, c.order AS order
`;

/** 指定した処理単位配下の ACCESSES（IO 対象への入出力） */
export const IO_PLAN_ACCESSES = `
MATCH (u {id: $rootUnitId})-[:EXECUTES]->(r:IOOperation)
MATCH (r)-[:CHILD*0..]->(op:IOOperation)-[a:ACCESSES]->(t)
RETURN op.id AS opId, head(labels(t)) AS label, t.name AS name, a.mode AS mode
`;
