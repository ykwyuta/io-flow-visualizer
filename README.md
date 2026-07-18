# io-flow-visualizer

プログラムの処理構造を 3 つの視点で分析・可視化するツール（Neo4j + Next.js）。

## 可視化モード

1. **IO 分析モード** — ファイル/テーブル/外部システム/MQ/セッションへの IO 処理構造を、SQL Server の実行計画のような見た目で可視化。
2. **依存関係分析モード** — システム単位・ファイル単位・コード単位（関数/クラス・メソッド/セクション）の依存関係を可視化。
3. **画面関係分析モード** — 画面間の遷移関係を可視化。

## スコープ

- 本プロジェクトの責務は「**Neo4j にどの構造のデータを登録するか**」の定義と、その構造の可視化まで。
- ソースを解析して Neo4j へ登録するシステムは範囲外。

## 構成

| パス | 用途 |
| :-- | :-- |
| `graph-model/` | Neo4j 登録データ構造の TypeScript 型定義（中核） |
| `neo4j/` | スキーマ（制約・索引）・サンプルデータ・compose |
| `docs/` | 設計ドキュメント（`graph-model.md` が一次定義） |
| `src/` | Next.js 可視化アプリ |

## 開発

```bash
# 依存インストール
npm install

# ローカル Neo4j 起動 + スキーマ/サンプル投入
docker compose -f neo4j/docker-compose.yml up -d
cat neo4j/schema/constraints.cypher neo4j/schema/indexes.cypher neo4j/seed/sample.cypher \
  | docker exec -i io-flow-neo4j cypher-shell -u neo4j -p password

# 開発サーバ
npm run dev
```

詳細は [`docs/`](docs/) を参照。
