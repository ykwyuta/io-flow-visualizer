# io-flow-visualizer

プログラムの処理構造を 3 つの視点で分析・可視化するツール（Neo4j + Next.js）。

## 可視化モード

1. **IO 分析モード** — ファイル/テーブル/外部システム/MQ/セッションへの IO 処理構造を、SQL Server の実行計画のような見た目で可視化。
2. **依存関係分析モード** — システム単位・ファイル単位・コード単位（関数/クラス・メソッド/セクション）の依存関係を可視化。
3. **画面関係分析モード** — 画面間の遷移関係を可視化。

## 検索システム（大規模アプリ対応）

巨大なアプリケーションでは全件ロード方式が破綻するため、全件をロードせず境界付き（ページング・近傍）で探索する検索システムを用意している（`/search`）。検索窓＋種別ファセットによる絞り込みと、グラフDBへの Cypher 直接クエリ（読み取り専用）の両方に対応する。詳細は [`docs/search-system.md`](docs/search-system.md)。

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

---

## 利用方法

### 前提

- Node.js 20 以上 / npm
- Docker（ローカル Neo4j を起動する場合）

### 1. 依存インストール

```bash
npm install
```

### 2. Neo4j の起動とデータ投入

同梱の compose でローカル Neo4j を起動し、スキーマ（制約・索引）とサンプルデータを投入する。

```bash
# Neo4j 5 を起動（HTTP: 7474 / Bolt: 7687、認証 neo4j/password）
docker compose -f neo4j/docker-compose.yml up -d

# 起動完了を待ってから、スキーマ + サンプルを投入
cat neo4j/schema/constraints.cypher neo4j/schema/indexes.cypher neo4j/seed/sample.cypher \
  | docker exec -i io-flow-neo4j cypher-shell -u neo4j -p password
```

- Neo4j Browser: <http://localhost:7474>（ユーザ `neo4j` / パスワード `password`）
- 自前のデータを使う場合は、`neo4j/schema/` を適用したうえで [`docs/graph-model.md`](docs/graph-model.md) の構造に沿って登録する。

### 3. アプリの起動

接続先は環境変数で指定する（未指定時は下記の既定値）。

| 環境変数 | 既定値 | 説明 |
| :-- | :-- | :-- |
| `NEO4J_URL` | `bolt://localhost:7687` | Bolt 接続 URL |
| `NEO4J_USER` | `neo4j` | ユーザ |
| `NEO4J_PASSWORD` | `password` | パスワード |

```bash
# 開発サーバ
npm run dev
# 本番ビルドで起動する場合
npm run build && npm run start
```

ブラウザで <http://localhost:3000> を開く。

> Neo4j に接続できない場合や対象データが無い場合は、各モードとも `neo4j/seed/sample.cypher` と同じ内容のサンプルを表示する（画面上に注意バナーを表示）。DB なしでも UI を確認できる。

### 4. 各モードの使い方

ヘッダーのナビゲーションからモードを切り替える。

- **検索** (`/search`): 検索窓と種別ファセットで対象を絞り込み（ページング対応）、ヒットしたノードの近傍グラフへドリルダウンする。別タブで Cypher を直接投入（読み取り専用）できる。詳細は [`docs/search-system.md`](docs/search-system.md)。
- **IO 分析** (`/io`): 処理単位を選ぶと、その IO 実行計画ツリーを表示する。演算子はグループごとに色分けし、各ノードに対象（テーブル/ファイル/外部システム/MQ/セッション）と読み書き、推定行数・コストを示す。
- **依存関係分析** (`/dependency/system` · `/file` · `/code`): 粒度タブを切り替えて、システム / ファイル / コードの依存グラフを表示する。
- **画面関係分析** (`/screen`): 画面遷移を有向グラフで表示し、遷移のきっかけを矢印ラベルに示す。

#### モード横断ドリルダウン

- 依存関係（コード単位）や画面遷移で、IO 実行計画を持つノードには `↗` が付き、クリックすると IO 分析モード（`/io?unit=<id>`）へ遷移する。
- IO 分析モードからは、依存関係（コード単位）ビューと、その処理単位を担当する画面へのリンクを表示する。

### 5. 開発用コマンド

```bash
npm run typecheck   # 型チェック（tsc --noEmit）
npm run build       # 本番ビルド
```

### 停止・後片付け

```bash
docker compose -f neo4j/docker-compose.yml down       # コンテナ停止（データは保持）
docker compose -f neo4j/docker-compose.yml down -v    # ボリュームごと削除
```

---

設計の詳細は [`docs/`](docs/)（`graph-model.md` が一次定義）を参照。
