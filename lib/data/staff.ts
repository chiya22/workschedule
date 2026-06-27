import { createClient } from '@/lib/supabase/server'
import type { Staff } from '@/types'

const STAFF_LIST_SELECT =
  'id, user_id, login_id, name, role, notification_email, created_at' as const

export async function listStaffAccounts(): Promise<Staff[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .select(STAFF_LIST_SELECT)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('listStaffAccounts failed', error)
    return []
  }

  return data ?? []
}
