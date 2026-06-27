import { createClient } from '@/lib/supabase/server'
import type { Staff } from '@/types'

/**
 * 現在のログインユーザーのスタッフ行を返す。
 * 未ログインまたは staff にいない場合は null。
 */
export async function getCurrentStaff(): Promise<Staff | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('staff')
    .select(
      'id, user_id, login_id, name, role, notification_email, created_at',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('getCurrentStaff: staff の取得に失敗しました', {
      message: error.message,
      code: error.code,
      userId: user.id,
    })
    return null
  }

  return data
}
