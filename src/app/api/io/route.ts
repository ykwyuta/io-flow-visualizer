import { NextResponse } from 'next/server';
import { readQuery } from '@/server/neo4j/driver';

/**
 * IO分析モード用データ取得。
 * ある処理単位（rootId）配下の実行計画ツリーと ACCESSES 対象を返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rootId = searchParams.get('rootId');
  if (!rootId) {
    return NextResponse.json({ error: 'rootId is required' }, { status: 400 });
  }

  const rows = await readQuery(
    `MATCH (root)-[:EXECUTES]->(op:IOOperation)
     WHERE root.id = $rootId
     MATCH (op)-[:CHILD*0..]->(child:IOOperation)
     OPTIONAL MATCH (child)-[a:ACCESSES]->(target)
     RETURN child, a, target`,
    { rootId },
  );

  return NextResponse.json({ rows });
}
