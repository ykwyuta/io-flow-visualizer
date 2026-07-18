# サブエージェント（sub-agents）作成ルール

**適用対象:** カスタムサブエージェントを新規作成・改定するとき。
**要点:** サブエージェントは「YAML フロントマター＋Markdown 本体（システムプロンプト）」を持つ 1 つの Markdown ファイル。`name` と `description` が必須。独自のコンテキスト・ツール制限・権限で動く。

> 公式ドキュメント: <https://code.claude.com/docs/ja/sub-agents>

---

## 1. サブエージェントとは

- 特定種類のタスクを **独自のコンテキストウィンドウ** で処理し、概要だけをメイン会話に返す。
- 用途: コンテキストの分離保持 / 使用ツールの制約強制 / 設定の再利用 / 挙動の特化 / 安価なモデルへのルーティング。
- Claude は各サブエージェントの `description` を見て委譲するか判断するため、**説明を明確に**書く。

## 2. ファイルの保存場所（スコープ）

本リポジトリでは、チームで共有するプロジェクトサブエージェントを基本とする。

| スコープ | パス | 優先度 |
| :-- | :-- | :-- |
| Project（推奨） | `.claude/agents/<name>.md` | 高（バージョン管理にコミットして共有） |
| User | `~/.claude/agents/<name>.md` | 低（個人の全プロジェクト） |

- `.claude/agents/` は再帰的にスキャンされるため、`agents/review/` 等のサブフォルダで整理してよい（識別は `name` フィールドのみで行われ、パスは影響しない）。
- `name` はツリー全体で **一意** に保つ。同名が複数あると 1 つしか読み込まれない。
- 新しい `agents` ディレクトリを初めて作成した場合は、Claude Code の再起動が必要なことがある。

## 3. ファイルの構造

```markdown
---
name: code-reviewer
description: コード品質とベストプラクティスをレビューする。コード変更後に使用。
tools: Read, Glob, Grep
model: sonnet
---

あなたはコードレビュアーです。呼び出されたら、品質・セキュリティ・
ベストプラクティスについて具体的で実行可能なフィードバックを返します。
```

- フロントマター = メタデータ／設定。本体 = サブエージェントのシステムプロンプト。
- サブエージェントはこのシステムプロンプト（＋作業ディレクトリ等の基本情報）のみを受け取り、Claude Code の完全なシステムプロンプトは受け取らない。

## 4. フロントマター（主なフィールド）

**必須は `name` と `description` のみ。**

| フィールド | 必須 | 説明 |
| :-- | :-- | :-- |
| `name` | ✅ | 小文字とハイフンの一意な識別子。ファイル名と一致しなくてよい。 |
| `description` | ✅ | どんなときに委譲するか。積極委譲させたいなら "use proactively" 等を含める。 |
| `tools` | | 使用可能ツール（省略時は全ツール継承）。スキルのプリロードは `tools` でなく `skills` を使う。 |
| `disallowedTools` | | 継承／指定リストから除外するツール。 |
| `model` | | `sonnet` / `opus` / `haiku` / `fable` / 完全ID / `inherit`。既定は `inherit`。 |
| `permissionMode` | | `default` / `acceptEdits` / `auto` / `dontAsk` / `bypassPermissions` / `plan`。 |
| `skills` | | 起動時にコンテキストへプリロードするスキル（説明でなく全文が注入される）。 |
| `maxTurns` | | 停止までの最大ターン数。 |
| `memory` | | 永続メモリのスコープ: `user` / `project` / `local`。 |
| `mcpServers` | | このサブエージェントで使う MCP サーバー。 |
| `hooks` | | このサブエージェントにスコープされたライフサイクルフック。 |
| `effort` | | 努力レベルの上書き（`low`〜`max`）。 |
| `isolation` | | `worktree` で分離した git worktree 上で実行。 |
| `color` | | タスクリスト等での表示色。 |

## 5. ツール制限

- `tools`（許可リスト）または `disallowedTools`（拒否リスト）で使用ツールを絞る。
- 両方指定時は `disallowedTools` を先に適用し、残りに `tools` を解決する。
- `AskUserQuestion` / `EnterPlanMode` / `ExitPlanMode` 等、UI・セッション状態に依存するツールは `tools` に書いてもサブエージェントでは使えない。
- 読み取り専用の調査エージェントなら `tools: Read, Grep, Glob, Bash` のように最小限にする。

## 6. モデル選択

- `model` は `sonnet` / `opus` / `haiku` / `fable` / 完全モデルID / `inherit` を受け付ける。既定は `inherit`。
- 調査・大量処理など軽いタスクは安価なモデル（`haiku` 等）を検討し、コストを制御する。

## 7. ベストプラクティス

- **単一責務** に絞る。1 つのサブエージェントに詰め込みすぎない。
- `description` は委譲判断の要。対象タスクと使うべき状況を明確に書く。
- システムプロンプト（本体）に、役割・手順・出力フォーマット・制約を具体的に記述する。
- 必要なツールだけを与え、権限を最小化する。

## 8. 履歴記録・廃止時の扱い

- サブエージェントの作成・改定履歴は `.claude/logs/skills-日時.log` に記録する。
- 廃止するサブエージェントは削除せず `.claude/deprecated/` に移動する。
- 詳細は [`skill-agent-lifecycle.md`](skill-agent-lifecycle.md) を参照。
