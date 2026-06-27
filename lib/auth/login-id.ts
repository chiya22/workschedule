/**
 * Supabase Auth の identifier としてメール形式が必要なため、アカウント文字列を擬似ドメインと組み合わせる。
 * 利用者はログイン画面に「メールではない」アカウントのみ入力すればよい。
 */

export const INTERNAL_AUTH_EMAIL_DOMAIN = 'accounts.resreserv.local'

const LOGIN_ID_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/

export function normalizeLoginId(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Auth API に渡すメール形式の識別子（小文字化済み login_id のみ想定） */
export function loginIdToAuthEmail(loginId: string): string {
  return `${loginId}@${INTERNAL_AUTH_EMAIL_DOMAIN}`
}

export function isValidLoginIdShape(normalized: string): boolean {
  return LOGIN_ID_RE.test(normalized)
}

/**
 * ログイン入力: `@` を含む場合は従来どおりメールとして扱う。
 * 含まない場合はアカウント文字列として擬似メールに変換する。
 */
export function loginInputToAuthEmail(loginInput: string): string {
  const t = loginInput.trim()
  if (t.includes('@')) return t
  const id = normalizeLoginId(t)
  return loginIdToAuthEmail(id)
}
