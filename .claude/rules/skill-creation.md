# スキル（Skills）作成ルール

**適用対象:** スキルを新規作成・改定するとき。
**要点:** スキルは `SKILL.md` を中心としたディレクトリで構成する。`description` の質がスキルの発動精度を決める。本体は簡潔に保ち、詳細は別ファイルに切り出す。

> 公式ドキュメント: <https://code.claude.com/docs/ja/skills>

---

## 1. ディレクトリ構成とファイル

- スキルは 1 つのディレクトリで、エントリポイントとして `SKILL.md`（**必須**）を持つ。
- サポートファイル（任意）を同ディレクトリに置いて、より強力なスキルを構築できる。
  - `reference.md` … 詳細リファレンス（必要時のみ読み込まれる）
  - `examples.md` … 出力例
  - `scripts/` … Claude が実行するスクリプト（読み込みではなく実行される）
- サポートファイルは `SKILL.md` から明示的に参照し、「何が書かれ、いつ読むべきか」を Claude に伝える。

```text
my-skill/
├── SKILL.md        # メイン指示（必須）
├── reference.md    # 詳細リファレンス（必要時に読込）
├── examples.md     # 使用例
└── scripts/
    └── helper.py   # 実行用スクリプト
```

## 2. 保存場所（スコープ）

本リポジトリでは、チームで共有するプロジェクトスキルを基本とする。

| スコープ | パス | 適用対象 |
| :-- | :-- | :-- |
| Project（推奨） | `.claude/skills/<skill-name>/SKILL.md` | このプロジェクトのみ。バージョン管理にコミットして共有 |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | 個人の全プロジェクト |

- コマンド名は **ディレクトリ名** から決まる（例: `.claude/skills/deploy-staging/` → `/deploy-staging`）。
- 同名スキルは enterprise > personal > project の順で優先される。

## 3. SKILL.md の構造

`SKILL.md` は「YAML フロントマター（`---` で囲む）」＋「Markdown 本体」で構成する。

```yaml
---
name: my-skill
description: 何をするスキルか。いつ使うか（主要ユースケースを先頭に）。
---

（本体: スキルが実行されるときに Claude が従う指示）
```

## 4. フロントマター（主なフィールド）

すべて任意だが、Claude が自動発動を判断するため **`description` は実質必須**。

| フィールド | 説明 |
| :-- | :-- |
| `name` | スキル一覧に表示される名称。省略時はディレクトリ名。 |
| `description` | 何をするか・いつ使うか。**主要ユースケースを先頭に**書く。`when_to_use` との合算で 1,536 文字に切り詰められる。 |
| `when_to_use` | 発動すべきトリガーフレーズや例。`description` に追記される。 |
| `disable-model-invocation` | `true` で自動発動を禁止し、`/name` の手動実行専用にする。副作用のある操作向け。 |
| `user-invocable` | `false` で `/` メニューから隠す。背景知識として Claude のみが使う用途。 |
| `allowed-tools` | このスキル有効時に確認なしで使えるツール（スペース区切り）。 |
| `argument-hint` | オートコンプリートで表示する引数ヒント（例: `[issue-number]`）。 |
| `context` | `fork` でサブエージェントの分離コンテキストとして実行。 |
| `agent` | `context: fork` 時に使うサブエージェントタイプ。 |
| `model` / `effort` | このスキル有効時のモデル・努力レベルの上書き。 |
| `paths` | glob にマッチするファイル操作時のみ自動発動させる制限。 |

## 5. `description` の書き方（発動精度の要）

- ユーザが自然に口にするキーワードを含める。
- 「何をするか」に加えて「いつ使うか」を明記する（例: `Use when the user asks ...`）。
- 主要ユースケースを先頭に置く（後半は文字数制限で切られる可能性がある）。

## 6. 本体の書き方（ベストプラクティス）

- **本体は簡潔に保つ。** 呼び出し後、内容はセッション中コンテキストに残り続けトークンコストになる。方法や理由の長い説明は避け、「何をするか」を述べる。
- `SKILL.md` は **500 行以下** を目安にし、詳細リファレンスは別ファイルへ切り出す。
- 呼び出し方（ユーザー / Claude / 両方）と実行場所（インライン / サブエージェント）を意識して内容を決める。
- 動的コンテキストが必要なら `` !`<command>` `` 構文でシェル出力を注入できる（Claude 到達前に実行・置換される）。

## 7. 引数

- `$ARGUMENTS` … 渡された全引数。`$ARGUMENTS[N]` / `$N` で位置指定。
- `${CLAUDE_SESSION_ID}` `${CLAUDE_SKILL_DIR}` `${CLAUDE_PROJECT_DIR}` などの置換が使える。
- バンドルスクリプトの参照は、インストール場所に依存しない `${CLAUDE_SKILL_DIR}` を使う。

## 8. 履歴記録・廃止時の扱い

- スキルの作成・改定履歴は `.claude/logs/skills-日時.log` に記録する。
- 廃止するスキルは削除せず `.claude/deprecated/` に移動する。
- 詳細は [`skill-agent-lifecycle.md`](skill-agent-lifecycle.md) を参照。
