'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import {
  createStaffAccount,
  deleteStaffAccount,
  updateStaffAccount,
} from '@/lib/data/staff-account-actions'
import { staffRoleLabelJa } from '@/lib/shift/roles'
import type { Staff, StaffRole } from '@/types'

type StaffAccountsManagerProps = {
  staff: Staff[]
  currentUserId: string
}

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: staffRoleLabelJa('admin') },
  { value: 'member', label: staffRoleLabelJa('member') },
  { value: 'part_time', label: staffRoleLabelJa('part_time') },
]

export function StaffAccountsManager({ staff, currentUserId }: StaffAccountsManagerProps) {
  const router = useRouter()
  const [createError, setCreateError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const [cLogin, setCLogin] = useState('')
  const [cPass, setCPass] = useState('')
  const [cName, setCName] = useState('')
  const [cRole, setCRole] = useState<StaffRole>('member')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setPendingId('create')
    const r = await createStaffAccount({
      login_id: cLogin,
      password: cPass,
      name: cName,
      role: cRole,
    })
    setPendingId(null)
    if (!r.success) {
      setCreateError(r.error)
      return
    }
    setCLogin('')
    setCPass('')
    setCName('')
    setCRole('member')
    router.refresh()
  }

  async function handleDelete(row: Staff) {
    if (row.user_id === currentUserId) return
    if (!window.confirm(`「${row.login_id}」を削除しますか？この操作は取り消せません。`)) return
    setPendingId(row.id)
    const r = await deleteStaffAccount(row.id)
    setPendingId(null)
    if (!r.success) {
      window.alert(r.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-bg-primary p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <h2 className="text-sm font-medium text-text-primary">アカウントを作成</h2>
        <p className="mt-1 text-xs text-text-secondary">
          パスワードは作成時に設定し、利用者に伝えてください。
        </p>

        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs text-text-tertiary">アカウント</span>
            <input
              value={cLogin}
              onChange={(ev) => setCLogin(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              required
              autoComplete="off"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs text-text-tertiary">初期パスワード</span>
            <input
              type="password"
              value={cPass}
              onChange={(ev) => setCPass(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              required
              autoComplete="new-password"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs text-text-tertiary">表示名</span>
            <input
              value={cName}
              onChange={(ev) => setCName(ev.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              required
              autoComplete="name"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-xs text-text-tertiary">権限</span>
            <select
              value={cRole}
              onChange={(ev) => setCRole(ev.target.value as StaffRole)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {ROLES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pendingId === 'create'}
              className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B7DE8] disabled:opacity-60"
            >
              {pendingId === 'create' ? '作成しています…' : '作成'}
            </button>
            {createError ? (
              <p className="mt-2 text-sm text-shift-part-time-text" role="alert">
                {createError}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-primary">登録一覧</h2>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg-surface text-text-tertiary">
              <tr>
                <th className="px-3 py-2 font-normal">アカウント</th>
                <th className="px-3 py-2 font-normal">表示名</th>
                <th className="px-3 py-2 font-normal">権限</th>
                <th className="px-3 py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <StaffRowEditor
                  key={row.id}
                  row={row}
                  currentUserId={currentUserId}
                  pendingId={pendingId}
                  setPendingId={setPendingId}
                  onRefresh={() => router.refresh()}
                  onDelete={() => void handleDelete(row)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

type StaffRowEditorProps = {
  row: Staff
  currentUserId: string
  pendingId: string | null
  setPendingId: (id: string | null) => void
  onRefresh: () => void
  onDelete: () => void
}

function StaffRowEditor({
  row,
  currentUserId,
  pendingId,
  setPendingId,
  onRefresh,
  onDelete,
}: StaffRowEditorProps) {
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loginId, setLoginId] = useState(row.login_id)
  const [name, setName] = useState(row.name)
  const [role, setRole] = useState<StaffRole>(row.role)
  const [newPassword, setNewPassword] = useState('')

  const isSelf = row.user_id === currentUserId
  const busy = pendingId === row.id

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    setPendingId(row.id)
    const r = await updateStaffAccount({
      staffId: row.id,
      login_id: loginId !== row.login_id ? loginId : undefined,
      name: name !== row.name ? name : undefined,
      role: role !== row.role ? role : undefined,
      newPassword: newPassword.trim() ? newPassword : undefined,
    })
    setPendingId(null)
    if (!r.success) {
      setErr(r.error)
      return
    }
    setEditing(false)
    setNewPassword('')
    onRefresh()
  }

  if (!editing) {
    return (
      <tr className="border-b border-border last:border-b-0">
        <td className="px-3 py-2 text-text-primary">{row.login_id}</td>
        <td className="px-3 py-2 text-text-secondary">{row.name}</td>
        <td className="px-3 py-2 text-text-secondary">
          {ROLES.find((r) => r.value === row.role)?.label ?? row.role}
        </td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            onClick={() => {
              setLoginId(row.login_id)
              setName(row.name)
              setRole(row.role)
              setNewPassword('')
              setErr(null)
              setEditing(true)
            }}
            className="mr-2 rounded-md border border-border px-2 py-1 text-text-secondary transition-colors hover:bg-bg-hover"
          >
            編集
          </button>
          <button
            type="button"
            disabled={isSelf || busy}
            onClick={onDelete}
            className="rounded-md border border-border px-2 py-1 text-text-secondary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            削除
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border bg-bg-surface last:border-b-0">
      <td colSpan={4} className="p-3">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-text-tertiary">アカウント</span>
              <input
                value={loginId}
                onChange={(ev) => setLoginId(ev.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-text-tertiary">表示名</span>
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-text-tertiary">権限</span>
              <select
                value={role}
                disabled={isSelf}
                onChange={(ev) => setRole(ev.target.value as StaffRole)}
                className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs outline-none focus:border-accent disabled:opacity-60"
              >
                {ROLES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {isSelf ? (
                <span className="mt-1 block text-[11px] text-text-tertiary">
                  自分の権限は変更できません
                </span>
              ) : null}
            </label>
          </div>
          <label className="block max-w-xs">
            <span className="mb-1 block text-[11px] text-text-tertiary">
              新しいパスワード（空欄なら変更なし）
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs outline-none focus:border-accent"
              autoComplete="new-password"
            />
          </label>
          {err ? (
            <p className="text-xs text-shift-part-time-text" role="alert">
              {err}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-[#3B7DE8] disabled:opacity-60"
            >
              {busy ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setErr(null)
                setNewPassword('')
              }}
              className="rounded-lg border border-border px-4 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
            >
              キャンセル
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}
