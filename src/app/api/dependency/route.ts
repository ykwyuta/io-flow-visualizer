import { NextResponse } from 'next/server';
import { readQuery } from '@/server/neo4j/driver';

/**
 * 依存関係分析モード用データ取得。
 * granularity（system | file | code）に応じたノードと依存関係を返す。
 */
const QUERIES: Record<string, string> = {
  system: `MATCH (a:System)-[r:DEPENDS_ON]->(b:System) RETURN a, r, b`,
  file: `MATCH (a:File)-[r:DEPENDS_ON]->(b:File) RETURN a, r, b`,
  code: `MATCH (a)-[r:CALLS]->(b) RETURN a, r, b`,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const granularity = searchParams.get('granularity') ?? 'system';
  const cypher = QUERIES[granularity];
  if (!cypher) {
    return NextResponse.json({ error: 'invalid granularity' }, { status: 400 });
  }

  const rows = await readQuery(cypher);
  return NextResponse.json({ rows });
}
