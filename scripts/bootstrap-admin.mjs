/**
 * 初回管理者（staff admin）を作成する。
 * 使い方: node scripts/bootstrap-admin.mjs [login_id] [表示名] [password]
 * 環境変数: .env.local の NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const text = readFileSync(resolve(root, '.env.local'), 'utf8')
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=')
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      }),
  )
}

const LOGIN_ID = (process.argv[2] ?? 'admin').trim().toLowerCase()
const NAME = process.argv[3] ?? '管理者'
const PASSWORD = process.argv[4] ?? 'AdminChangeMe1!'
const EMAIL = `${LOGIN_ID}@accounts.resreserv.local`

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が .env.local にありません')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existingStaff } = await supabase
  .from('staff')
  .select('id, login_id, name, role')
  .eq('login_id', LOGIN_ID)
  .maybeSingle()

if (existingStaff) {
  console.log(JSON.stringify({ status: 'already_exists', staff: existingStaff }, null, 2))
  process.exit(0)
}

let userId

const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
})

if (createErr) {
  const duplicate =
    createErr.message?.includes('already been registered') || createErr.status === 422
  if (!duplicate) {
    console.error('Auth ユーザー作成失敗:', createErr.message)
    process.exit(1)
  }
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listErr) {
    console.error('Auth ユーザー一覧取得失敗:', listErr.message)
    process.exit(1)
  }
  const found = list.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())
  if (!found) {
    console.error('重複エラー後に Auth ユーザーが見つかりません')
    process.exit(1)
  }
  userId = found.id
} else {
  userId = created.user.id
}

const { data: staffRow, error: insErr } = await supabase
  .from('staff')
  .insert({
    user_id: userId,
    login_id: LOGIN_ID,
    name: NAME,
    role: 'admin',
    notification_email: null,
  })
  .select('id, login_id, name, role')
  .single()

if (insErr) {
  console.error('staff 行の作成失敗:', insErr.message)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'created',
      login_id: LOGIN_ID,
      password: PASSWORD,
      staff: staffRow,
    },
    null,
    2,
  ),
)
