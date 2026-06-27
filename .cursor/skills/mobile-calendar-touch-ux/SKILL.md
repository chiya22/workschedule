---
name: mobile-calendar-touch-ux
description: Guides responsive layouts, WCAG-aligned touch targets, and tablet/iPad calendar UX for Next.js/Tailwind calendar views. Use when improving mobile UX, responsive design, smartphone or tablet layouts, touch or tap targets, iPad breakpoints, WeekView/DayCalendar/MonthCalendar, CalendarToolbar, reservation blocks and modals, safe-area notches, or horizontal scroll inside the scheduling grid.
---

# モバイル・タッチ・iPad（カレンダー）UX スキル

飲食店予約カレンダーは **スタッフがタブレット・スマホで操作する**ことを前提に、変更時はこのスキルに沿って設計する。

## 適用順序（作業チェックリスト）

変更のたびに次を順に確認する。

1. **ブレークポイント**：`sm` / `md` / `lg` を横断したレイアウト（コンテンツ欠け・縦スクロール地獄がないか）。
2. **タップ領域**：操作要素が **約 44×44px（最低 44×44 CSS px）相当**になるよう `min-h` / `min-w` / `py` / `px` で確保。**隣接するタップ対象間に十分なギャップ**（誤タップ回避）。
3. **ホバーだけに依存しない**：主要操作は `:hover` 以外でも判別できる（視覚的な「押せる」境界・ラベル・余白）。
4. **スクロールとジェスチャ**：カレンダー横スクロールが必要な場合は `touch-action`/オーバーフローを明示し、意図しないブラウザ戻りと競合しないか確認。
5. **モーダル**：小画面では全幅〜ほぼ全高の利用可否、キーボード表示時のフォーム送信の届きやすさ。
6. **iPad**：ポートレート／ランドスケープ両方で、週／日ヘッダー・タイムライルール・ツールバーが **折りたたみ／再配置されても一貫する**こと。

## タッチ向け実装ガイド

| 領域 | 推奨 |
|------|------|
| ボタン・チップ・アイコン付きボタン | アイコンのみにしない。**ラベル**または **`aria-label` + 視覚的に十分なヒットボックス**（プロジェクト規約に合わせる） |
| 予約ブロック（グリッド上） | 最低高さ／タッチ余白を確保。競合時はドラッグと誤別を許容しない簡単なレイアウト調整優先 |
| ツールバー・曜日ヘッダー | `flex-wrap` と `gap`、必要なら `scroll` と影なしスクロール可能エリア |

## iPad でのカレンダー最適化（方針）

- **レイアウト密度**：ワイド幅では情報密度を上げられるが、`md`〜`lg` で列幅が極端に細くなるとタップミス増。**列の最小幅を確保する**または **横スクロールを許容したグリッド**を検討。
- **週／日ビューの軸**：左の時刻列は固定・ヘッダー固定など、スクロール時の文脈を失わせない工夫を検討（実装コンポーネントの既存 CSS Grid / `sticky` と整合）。
- **Safe area**：ノッチ環境では `padding` / `env(safe-area-inset-*)` をフルスクリーン近いレイアウトに検討。

## 本リポジトリとの整合（必読）

モバイル変更時も **`/.cursor/rules/design-system.mdc` を優先**。特に：

- アクセント色・タイポ（例：`font-semibold`/600 は使わない）
- **モーダル以外シャドウ禁止**、ボーダーでの階層化
- スピナー禁止（Skeleton は規約準拠で可）

関連コードの主な場所：

- `components/calendar/`（ビュー・ツールバー・ブロック）
- `components/modals/`（新規／詳細）
- `app/(dashboard)/calendar/`

## 参照するだけでよいとき

既存レイアウトの「問題点の棚卸し」や PR レビューでは、チェックリストに沿って項目ごとに根拠（画面幅・コンポーネント名・CSS 選択子）を短く書く。
