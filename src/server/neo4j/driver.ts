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

/** 任意の Cypher を「読み取り専用」で安全に実行するための結果型 */
export interface RawQueryResult {
  /** 結果列名 */
  keys: string[];
  /** 各行を { 列名: 表示用の値 } に整形したもの */
  rows: Record<string, unknown>[];
}

/**
 * Neo4j の Node / Relationship / Path / Integer などを、
 * JSON 化しやすいプレーンな値へ再帰的に変換する。
 */
function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt(value)) return (value as { toNumber: () => number }).toNumber();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value instanceof neo4j.types.Node) {
    const node = value as unknown as { labels: string[]; properties: Record<string, unknown> };
    return { _type: 'node', labels: node.labels, properties: serializeValue(node.properties) };
  }
  if (value instanceof neo4j.types.Relationship) {
    const rel = value as unknown as { type: string; properties: Record<string, unknown> };
    return { _type: 'relationship', relType: rel.type, properties: serializeValue(rel.properties) };
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

/**
 * ユーザ入力の Cypher を読み取り専用で実行する（検索システムの「クエリ直接投入」用）。
 * - READ セッション＋トランザクションタイムアウトで暴走を防ぐ。
 * - 呼び出し側で書き込み系キーワードを事前に弾く前提（多層防御）。
 */
export async function readRawQuery(
  cypher: string,
  params: Record<string, unknown> = {},
  timeoutMs = 5000,
): Promise<RawQueryResult> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params), {
      timeout: timeoutMs,
    });
    const keys = (result.records[0]?.keys ?? []) as string[];
    const rows = result.records.map((r) => {
      const obj = r.toObject();
      const serialized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) serialized[k] = serializeValue(v);
      return serialized;
    });
    return { keys, rows };
  } finally {
    await session.close();
  }
}
