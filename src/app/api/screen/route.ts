import { NextResponse } from 'next/server';
import { getScreenGraph } from '@/server/neo4j/repositories/screen-repository';

/**
 * 画面関係分析モード用データ取得。
 * Screen 間の TRANSITIONS_TO をグラフ（nodes/edges）で返す。
 */
export async function GET() {
  const graph = await getScreenGraph();
  return NextResponse.json({ graph });
}
