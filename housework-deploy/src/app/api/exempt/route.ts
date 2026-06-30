import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/db'

// 豁免：老婆直接把债务标记为已付（销账）
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })
  if (session.role !== 'wife') return NextResponse.json({ error: '只有老婆可以豁免债务' }, { status: 403 })

  const body = await req.json()
  const { debtId } = body

  const db = getSupabase()
  const { error } = await db.from('debts').update({ status: 'paid', amount: 0 }).eq('id', debtId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
