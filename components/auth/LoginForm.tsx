'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginInputToAuthEmail } from '@/lib/auth/login-id'
import { createClient } from '@/lib/supabase/client'

const MESSAGE_COPY: Record<string, string> = {
  staff_required:
    'このアカウントはスタッフとして登録されていません。Supabase の staff テーブルに user_id を追加するか、管理者に依頼してください。',
}

type LoginFormProps = {
  redirectTo?: string
  serverMessageCode?: string
}

function sanitizeRedirectPath(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '/calendar'
  const p = raw.trim()
  if (!p.startsWith('/') || p.startsWith('//')) return '/calendar'
  if (p.includes('://') || p.includes('\\')) return '/calendar'
  return p
}

export function LoginForm({ redirectTo, serverMessageCode }: LoginFormProps) {
  const router = useRouter()
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const serverHint =
    serverMessageCode && MESSAGE_COPY[serverMessageCode]
      ? MESSAGE_COPY[serverMessageCode]
      : serverMessageCode
        ? 'ログインできません。管理者にお問い合わせください。'
        : null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    const email = loginInputToAuthEmail(loginOrEmail)
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setPending(false)

    if (signError) {
      if (signError.message.includes('Email not confirmed')) {
        setError('アカウントの確認が完了していません。管理者にお問い合わせください。')
        return
      }
      setError(
        signError.message === 'Invalid login credentials'
          ? 'アカウントまたはパスワードが正しくありません'
          : signError.message,
      )
      return
    }

    router.replace(sanitizeRedirectPath(redirectTo))
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="w-full max-w-[400px] space-y-4">
      {serverHint ? (
        <div
          className="rounded-lg border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary"
          role="status"
        >
          {serverHint}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-3 block text-xs text-accent transition-opacity hover:underline"
          >
            別のアカウントでログインする
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-bg-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <h1 className="text-[17px] font-medium text-text-primary">ログイン</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-account" className="mb-1 block text-xs text-text-tertiary">
              アカウント
            </label>
            <input
              id="login-account"
              name="account"
              type="text"
              autoComplete="username"
              required
              value={loginOrEmail}
              onChange={(ev) => setLoginOrEmail(ev.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs text-text-tertiary">
              パスワード
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-shift-part-time-text" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'ログインしています…' : 'ログイン'}
          </button>
        </div>
      </form>
    </div>
  )
}
