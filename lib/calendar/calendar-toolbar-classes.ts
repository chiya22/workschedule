/**
 * カレンダーツールバー／横スクロールの共通クラス。
 * iOS のホームインジケータ・ノッチとの干渉を避けつつタップ領域を広げる。
 */

export const calScrollX =
  "min-w-0 w-full max-w-full flex-1 overflow-x-auto overscroll-x-contain touch-pan-x";

/** ページ縦コンテナ（横パディングはモバイル寄り。ノッチ等は dashboard layout の safe area と併用） */
export const calPageShell =
  "flex min-h-full w-full min-w-0 max-w-full flex-1 flex-col gap-4 px-3 pb-4 pt-4 sm:px-6 md:gap-5";

/** 時刻ガター幅: モバイル 52px・md 以上 56px（w-14） */
export const calTimeGutter =
  "box-border w-[52px] shrink-0 md:w-14";

export const calTouchNavArrow =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-bg-primary text-base leading-none text-text-secondary transition-transform duration-100 hover:bg-bg-hover active:scale-[0.97] touch-manipulation";

export const calTouchOutlineSm =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border-[0.5px] border-border px-4 text-xs text-text-secondary transition-transform duration-100 hover:bg-bg-hover active:scale-[0.97] touch-manipulation";

export const calTouchAccentSm =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border-[0.5px] border-border bg-bg-primary px-4 text-xs font-medium text-accent transition-transform duration-100 hover:bg-bg-hover active:scale-[0.97] touch-manipulation";

export function calViewSegBtn(active: boolean): string {
  const base =
    "inline-flex min-h-11 min-w-10 items-center justify-center rounded-md border-[0.5px] px-3 text-xs transition-transform duration-100 active:scale-[0.97] touch-manipulation";
  return active
    ? `${base} border-border bg-bg-hover text-text-primary`
    : `${base} border-transparent text-text-secondary hover:bg-bg-hover`;
}
