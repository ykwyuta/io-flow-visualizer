# グラフモデル定義書

本ドキュメントは、本プロジェクトの **中核成果物** である「Neo4j に登録するデータ構造」の一次定義である。
プログラムの処理構造を 3 つの視点（IO 分析 / 依存関係分析 / 画面関係分析）で可視化するために必要なノード・リレーション・プロパティを定める。

> ソースを解析して本構造でデータを登録するシステムは本プロジェクトの範囲外である。
> 本プロジェクトの責務は「どの構造で登録するか」を定義し、その構造のグラフを可視化するところまで。

- TypeScript 型としての表現: [`graph-model/`](../graph-model/)
- スキーマ（制約・索引）としての表現: [`neo4j/schema/`](../neo4j/schema/)
- IO 実行計画ツリーの詳細: [`io-plan-model.md`](io-plan-model.md)
- 各モードとの対応: [`analysis-modes.md`](analysis-modes.md)

---

## 1. 設計方針

- 3 モードは **同一グラフを別視点でクエリ** する。ノード・リレーションは 3 モードで共有する。
- すべてのノードは一意識別子 `id`（文字列）を持ち、Neo4j 上で一意制約を張る。
- ノードの種別は **ラベル** で表す。同一概念で下位区分がある場合は `type` プロパティで細分する（例: `IOOperation.type`）。
- 依存の粒度（システム → ファイル → コード）は別ラベルで表現し、粒度をまたいだ掘り下げを可能にする。

---

## 2. ノード一覧

### 2.1 構造・依存系（依存関係分析モード）

| ラベル | 主なプロパティ | 説明 |
| :-- | :-- | :-- |
| `System` | `id`, `name` | システム。依存の最上位粒度。 |
| `File` | `id`, `path`, `name`, `language?` | ソースファイル。 |
| `Program` | `id`, `name` | プログラム（ファイル内の実行単位。言語により省略可）。 |
| `Section` | `id`, `name` | セクション（COBOL 等の手続き単位）。 |
| `Class` | `id`, `name`, `namespace?` | クラス。 |
| `Method` | `id`, `name`, `signature?` | メソッド。 |
| `Function` | `id`, `name`, `signature?` | 関数。 |

### 2.2 IO 対象系（IO 分析モード）

| ラベル | 主なプロパティ | 説明 |
| :-- | :-- | :-- |
| `Table` | `id`, `name`, `schema?` | DB テーブル。 |
| `DataFile` | `id`, `name`, `path?` | IO 対象としてのファイル（ソースファイル `File` とは区別）。 |
| `ExternalSystem` | `id`, `name` | 外部システム。 |
| `MessageQueue` | `id`, `name` | MQ。 |
| `Session` | `id`, `name` | セッション。 |

> 上記 5 種は「IO 対象」という共通概念。共通ラベル `IOTarget` を併せて付与し、`ACCESSES` の終点を横断的に扱えるようにする（例: `(:Table:IOTarget)`）。

### 2.3 処理系（IO 分析モード）

| ラベル | 主なプロパティ | 説明 |
| :-- | :-- | :-- |
| `IOOperation` | `id`, `type`, `label?`, `estimatedRows?`, `estimatedCost?` | IO 処理の 1 手続き。`type` は §4 の演算子。実行計画ツリーのノード。 |

### 2.4 画面系（画面関係分析モード）

| ラベル | 主なプロパティ | 説明 |
| :-- | :-- | :-- |
| `Screen` | `id`, `name`, `route?` | 画面。 |

---

## 3. リレーション一覧

| リレーション | 例 | プロパティ | 用途 |
| :-- | :-- | :-- | :-- |
| `CONTAINS` | `(System)-[:CONTAINS]->(File)` | | 構造（内包） |
| `DEFINES` | `(File)-[:DEFINES]->(Program\|Class\|Function)` | | 構造（定義） |
| `HAS_SECTION` | `(Program)-[:HAS_SECTION]->(Section)` | | 構造 |
| `HAS_METHOD` | `(Class)-[:HAS_METHOD]->(Method)` | | 構造 |
| `DEPENDS_ON` | `(System)-[:DEPENDS_ON]->(System)` / `(File)-[:DEPENDS_ON]->(File)` | `kind?` | 依存②（同粒度間） |
| `CALLS` | `(Function)-[:CALLS]->(Function)` / Method / Section | | 依存②（コード単位の呼び出し） |
| `EXECUTES` | `(Function\|Method\|Section)-[:EXECUTES]->(IOOperation)` | | IO①（実行計画の根） |
| `CHILD` | `(IOOperation)-[:CHILD]->(IOOperation)` | `order` | IO①（実行計画ツリーの親子） |
| `ACCESSES` | `(IOOperation)-[:ACCESSES]->(IOTarget)` | `mode` (`read`\|`write`) | IO①（対象への入出力） |
| `TRANSITIONS_TO` | `(Screen)-[:TRANSITIONS_TO]->(Screen)` | `trigger?` | 画面③（遷移） |
| `HANDLED_BY` | `(Screen)-[:HANDLED_BY]->(Function\|Method)` | | ②×③横断（任意） |

---

## 4. IOOperation.type（IO 演算子）

SQL Server の実行計画の演算子に相当する。`IOOperation` ノードの `type` に以下のいずれかを設定する。

- 走査・探索系: `scan`, `lookup`, `filter`, `loop`
- 整形・集約系: `sort`, `project`, `merge`, `aggregate`
- 更新系: `insert`, `update`, `upsert`, `delete`
- 制御系: `if`
- リソース制御系: `open`, `close`, `commit`, `rollback`

分類・列挙は [`graph-model/enums/io-operations.ts`](../graph-model/enums/io-operations.ts) に定義する。
実行計画ツリーとしての組み立て方は [`io-plan-model.md`](io-plan-model.md) を参照。

---

## 5. 一意制約・索引

各ノードラベルの `id` に一意制約を張る。詳細は [`neo4j/schema/constraints.cypher`](../neo4j/schema/constraints.cypher) と [`neo4j/schema/indexes.cypher`](../neo4j/schema/indexes.cypher) を参照。
