import 'server-only';
import neo4j, { type Driver } from 'neo4j-driver';

/**
 * Neo4j ドライバ（サーバー専用）。
 * 認証情報をクライアントへ露出させないため、必ず server 配下でのみ使用する。
 */
let driver: Driver | undefined;

export function getDriver(): Driver {
  if (!driver) {
    const url = process.env.NEO4J_URL ?? 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER ?? 'neo4j';
    const password = process.env.NEO4J_PASSWORD ?? 'password';
    driver = neo4j.driver(url, neo4j.auth.basic(user, password), {
      // Neo4j の Integer を素の number として受け取る（表示用途では扱いやすい）
      disableLosslessIntegers: true,
    });
  }
  return driver;
}

/** 読み取りクエリの実行ヘルパ */
export async function readQuery<T = unknown>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}
