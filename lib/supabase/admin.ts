import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/** Service Role のみ（サーバー専用）。Auth Admin API や RLS バイパス用途。 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY と NEXT_PUBLIC_SUPABASE_URL が必要です')
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
