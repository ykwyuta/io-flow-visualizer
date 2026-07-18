import { NextResponse } from 'next/server';
import { readQuery } from '@/server/neo4j/driver';

/**
 * 画面関係分析モード用データ取得。
 * Screen 間の TRANSITIONS_TO を返す。
 */
export async function GET() {
  const rows = await readQuery(
    `MATCH (a:Screen)-[r:TRANSITIONS_TO]->(b:Screen) RETURN a, r, b`,
  );
  return NextResponse.json({ rows });
}
