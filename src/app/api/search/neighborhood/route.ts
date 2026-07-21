import { NextResponse } from 'next/server';
import { getNeighborhood } from '@/server/neo4j/repositories/search-repository';

// Neo4j を毎リクエスト参照するため静的化しない
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * 指定ノードの近傍（1 ホップ）を境界付きで返す（検索結果からのドリルダウン用）。
 * クエリ: id（必須）, limit。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const rawLimit = Number.parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit));

  const response = await getNeighborhood(id, limit);
  return NextResponse.json(response);
}
