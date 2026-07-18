# 3 つの分析モードとグラフの対応

本プロジェクトは処理構造を 3 つの視点で可視化する。各モードが使うノード・リレーションを整理する。

> ノード・リレーションの定義は [`graph-model.md`](graph-model.md) を参照。

---

## ① IO 分析モード

ファイル・テーブル・外部システム・MQ・セッションに対する IO 処理構造を、SQL Server の実行計画のような見た目で可視化する。

- **主なノード**: `IOOperation`（`type`=scan/lookup/filter/loop/sort/project/merge/aggregate/insert/update/upsert/delete/if/open/close/commit/rollback）、`Table` / `DataFile` / `ExternalSystem` / `MessageQueue` / `Session`
- **主なリレーション**: `EXECUTES`（根）、`CHILD {order}`（実行計画ツリー）、`ACCESSES {mode}`（対象への入出力）
- **描画**: 実行計画ツリー（詳細は [`io-plan-model.md`](io-plan-model.md)）

---

## ② 依存関係分析モード

3 つの粒度で依存関係を可視化する。

| 粒度 | 主なノード | 主なリレーション |
| :-- | :-- | :-- |
| システム単位 | `System` | `DEPENDS_ON` |
| ファイル単位 | `File` | `DEPENDS_ON`、`CONTAINS`（System→File） |
| 関数・クラス/メソッド・セクション単位 | `Function` / `Class` / `Method` / `Section` | `CALLS`、`DEFINES` / `HAS_METHOD` / `HAS_SECTION` |

- **描画**: ノードリンク図（粒度を切り替え、上位から下位へドリルダウン）

---

## ③ 画面関係分析モード

画面間の遷移関係を可視化する。

- **主なノード**: `Screen`
- **主なリレーション**: `TRANSITIONS_TO {trigger}`
- **横断（任意）**: `HANDLED_BY`（`Screen`→`Function`/`Method`）で、遷移を担うコードへ接続し ② と横断できる
- **描画**: 遷移図（有向グラフ）

---

## モード横断

同一グラフ上に全モードのデータが乗るため、次のような横断分析が可能:

- ある `Screen` の遷移先で、どの `Table` に `write` しているか（③→②→①）
- ある `System` 配下の `Function` が実行する IO 対象の一覧（②→①）

### UI 上のドリルダウン

- 依存関係（コード単位）で IO 実行計画を持つノード、および画面遷移で担当コード（`HANDLED_BY`）が IO 実行計画を持つ画面は、ノードに `↗` を表示しクリックで IO 分析モード（`/io?unit=<id>`）へ遷移する。
- IO 分析モードからは、依存関係（コード単位）ビューと、その処理単位を担当する画面へのリンクを表示する。
