# IO 実行計画ツリーの表現方法

IO 分析モードは、IO 処理構造を **SQL Server の実行計画可視化のような見た目** で描画する。
そのための、Neo4j 上でのツリー表現方法を定める。

> 前提となるノード・リレーション定義は [`graph-model.md`](graph-model.md) を参照。

---

## 1. 基本構造

1 つの処理単位（`Function` / `Method` / `Section`）を根として、`IOOperation` のツリーがぶら下がる。

```text
(Function)
   │ EXECUTES
   ▼
(IOOperation: loop)                      ← 実行計画の根
   │ CHILD {order:0}
   ├─▶ (IOOperation: scan) ──ACCESSES{read}──▶ (Table)
   │ CHILD {order:1}
   └─▶ (IOOperation: aggregate)
          │ CHILD {order:0}
          └─▶ (IOOperation: filter) ──ACCESSES{read}──▶ (DataFile)
```

- **根**: `(処理単位)-[:EXECUTES]->(IOOperation)`。1 処理単位に複数の根を持ってよい。
- **親子**: `(IOOperation)-[:CHILD {order}]->(IOOperation)`。`order` は兄弟間の実行順（0 始まり）。
- **対象**: `(IOOperation)-[:ACCESSES {mode}]->(IOTarget)`。`mode` は `read` / `write`。

---

## 2. 演算子（type）と対象の対応の目安

| type | 典型的な `ACCESSES` | 備考 |
| :-- | :-- | :-- |
| `scan` / `lookup` / `filter` | `read` | データ取得・絞り込み |
| `insert` / `update` / `upsert` / `delete` | `write` | 更新系 |
| `open` / `close` | 対象への接続制御 | ファイル/セッション/MQ 等 |
| `commit` / `rollback` | （対象なし可） | トランザクション制御 |
| `sort` / `project` / `merge` / `aggregate` / `loop` / `if` | （対象なし可） | 中間処理・制御。子の結果に作用 |

---

## 3. 描画上の指針（Web 側）

- ツリーは根を上（または左）に、`CHILD.order` 昇順で子を並べる。
- 各ノードに `type` アイコンと `label`、任意で `estimatedRows` / `estimatedCost` を表示する（実行計画の推定行数・コストに相当）。
- `ACCESSES` の終点（対象種別）はノードの側に対象アイコン（table / file / external / mq / session）で示す。
- 実装は [`src/components/plan/`](../src/components/plan/) と [`src/features/io-analysis/`](../src/features/io-analysis/) に置く。

---

## 4. 取得クエリの例（Cypher）

ある処理単位配下の実行計画ツリーを取得する例:

```cypher
MATCH (root)-[:EXECUTES]->(op:IOOperation)
WHERE root.id = $rootId
CALL {
  WITH op
  MATCH path = (op)-[:CHILD*0..]->(child:IOOperation)
  OPTIONAL MATCH (child)-[a:ACCESSES]->(target)
  RETURN child, a, target, path
}
RETURN op, child, a, target, path
```

> 実クエリは `src/server/neo4j/queries/` に整理する。上記は構造理解のための概形。
