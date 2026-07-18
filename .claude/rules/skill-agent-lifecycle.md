# スキル・エージェントのライフサイクル管理ルール

**適用対象:** スキル／サブエージェントを作成・改定・廃止するとき。
**要点:** 作成・改定は必ず履歴ログに残し、廃止は削除せず退避する。

---

## 1. 作成・改定履歴の記録

スキルまたはサブエージェントを **作成・改定** したら、その履歴を必ず記録する。

- 記録先: `.claude/logs/skills-日時.log`
  - 日時は作業時刻を `YYYYMMDD-HHMMSS` 形式で用いる（例: `.claude/logs/skills-20260718-102058.log`）。
- 記録する内容:
  - 日時
  - 対象（スキル名 / サブエージェント名とパス）
  - 操作種別（新規作成 / 改定 / 廃止）
  - 変更の概要（何を・なぜ変えたか）

### 記録フォーマット例

```text
[2026-07-18 10:20:58] 新規作成 スキル: summarize-changes (.claude/skills/summarize-changes/)
  - 未コミット変更を要約しリスクを指摘するスキルを追加。
[2026-07-18 11:05:00] 改定 サブエージェント: code-reviewer (.claude/agents/code-reviewer.md)
  - description を強化し、モデルを haiku に変更してコスト削減。
```

## 2. 廃止時の扱い

スキルやサブエージェントを廃止するときは、**削除してはならない**。

- 対象ファイル／ディレクトリを `.claude/deprecated/` 以下へ **移動** する。
  - 例: `.claude/skills/old-skill/` → `.claude/deprecated/skills/old-skill/`
  - 例: `.claude/agents/old-agent.md` → `.claude/deprecated/agents/old-agent.md`
- 廃止も「改定」の一種として `.claude/logs/skills-日時.log` に記録する（操作種別: 廃止、移動元・移動先を明記）。
- 移動により Claude Code からは無効化される（`.claude/skills/` `.claude/agents/` 配下でなくなるため）。

## 3. 補足

- ここでの履歴ログ（`.claude/logs/skills-日時.log`）は、スキル／エージェント管理に特化したもの。
- ユーザ指摘に基づく一般作業の記録は `logs/claude-日時.log` に残す（`CLAUDE.md` 参照）。両者は用途が異なるため使い分ける。
